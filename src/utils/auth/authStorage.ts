/**
 * 存放登录 Session 的持久化读写：token、用户信息、
 * 内存缓存与清理等与认证状态存储相关的逻辑。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

import type { AuthUser, LoginSession } from '@/types';

const AUTH_SERVICE = 'com.supplier.auth';
const SESSION_STORAGE_KEY = '@supplier/auth/session';
const KEYCHAIN_MIGRATED_FLAG_KEY = '@supplier/auth/keychain-migrated';

/**
 * Android 部分 ROM 上 Keychain 单次读写可达 10~30s 且无法 cancel，会占满 JS 线程。
 * Session 主存储改用 AsyncStorage；iOS 仍用 Keychain 作为主存储。
 */
const USE_KEYCHAIN_PERSIST = Platform.OS === 'ios';

/** iOS Keychain 写入 debounce。 */
const KEYCHAIN_PERSIST_DEBOUNCE_MS = 1_000;

export interface StoredSession extends LoginSession {
  user?: AuthUser | null;
}

/**
 * 内存 session 缓存，避免每次 GraphQL 请求都触发磁盘读取。
 * undefined = 尚未加载；null = 已确认无 session。
 */
let sessionCache: StoredSession | null | undefined;

/** 每次 clearSession 递增，用于丢弃/回滚过期的 Keychain 写入。 */
let saveGeneration = 0;

/** 串行 Keychain 写入链（仅 iOS）。 */
let saveChain: Promise<void> = Promise.resolve();

/** 待写入 Keychain 的最新 session（coalesce）。 */
let pendingKeychainSession: StoredSession | null = null;

let keychainPersistTimer: ReturnType<typeof setTimeout> | null = null;

const keychainOptions = {
  service: AUTH_SERVICE,
};

function parseStoredSession(raw: string | null): StoredSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readAsyncStorageSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  return parseStoredSession(raw);
}

async function writeAsyncStorageSession(session: StoredSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

async function removeAsyncStorageSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

async function resetKeychain(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: AUTH_SERVICE,
  });
}

async function readKeychainSession(): Promise<StoredSession | null> {
  const credentials = await Keychain.getGenericPassword(keychainOptions);

  if (!credentials) {
    return null;
  }

  return parseStoredSession(credentials.password);
}

async function migrateFromKeychainOnce(): Promise<StoredSession | null> {
  if (Platform.OS !== 'android') {
    return readKeychainSession();
  }

  const migrated = await AsyncStorage.getItem(KEYCHAIN_MIGRATED_FLAG_KEY);
  if (migrated === 'true') {
    return null;
  }

  await AsyncStorage.setItem(KEYCHAIN_MIGRATED_FLAG_KEY, 'true');

  const keychainSession = await readKeychainSession();
  if (!keychainSession) {
    return null;
  }

  await writeAsyncStorageSession(keychainSession);
  void resetKeychain().catch((error) => {
    console.error('migrate session cleanup keychain error:', error);
  });

  return keychainSession;
}

async function writeSessionToKeychain(session: StoredSession, generation: number): Promise<void> {
  if (generation !== saveGeneration) {
    return;
  }

  try {
    await Keychain.setGenericPassword('auth', JSON.stringify(session), keychainOptions);

    if (generation !== saveGeneration) {
      void resetKeychain().catch((error) => {
        console.error('saveSession rollback error:', error);
      });
    }
  } catch (error) {
    console.error('saveSession error:', error);
    throw error;
  }
}

function cancelKeychainPersistTimer(): void {
  if (keychainPersistTimer) {
    clearTimeout(keychainPersistTimer);
    keychainPersistTimer = null;
  }
}

function drainKeychainQueue(): Promise<void> {
  if (!USE_KEYCHAIN_PERSIST) {
    return Promise.resolve();
  }

  saveChain = saveChain
    .then(async () => {
      while (pendingKeychainSession) {
        const session = pendingKeychainSession;
        const generation = saveGeneration;
        pendingKeychainSession = null;

        if (generation !== saveGeneration) {
          continue;
        }

        await writeSessionToKeychain(session, generation);

        if (generation !== saveGeneration) {
          break;
        }
      }
    })
    .catch((error) => {
      console.error('saveChain error:', error);
    });

  return saveChain;
}

function scheduleKeychainPersist(session: StoredSession, immediate = false): void {
  if (!USE_KEYCHAIN_PERSIST) {
    return;
  }

  pendingKeychainSession = session;
  cancelKeychainPersistTimer();

  if (immediate) {
    void drainKeychainQueue();
    return;
  }

  keychainPersistTimer = setTimeout(() => {
    keychainPersistTimer = null;
    void drainKeychainQueue();
  }, KEYCHAIN_PERSIST_DEBOUNCE_MS);
}

/**
 * 仅更新内存缓存（不写磁盘）。
 */
export function setSessionCache(session: StoredSession): void {
  sessionCache = session;
}

/**
 * 更新内存 + AsyncStorage（主链路，毫秒级）。
 * iOS 额外延迟同步 Keychain。
 */
export function persistSession(
  session: StoredSession,
  options?: { keychainImmediate?: boolean },
): void {
  sessionCache = session;

  void writeAsyncStorageSession(session).catch((error) => {
    console.error('persistSession asyncStorage error:', error);
  });

  scheduleKeychainPersist(session, options?.keychainImmediate ?? false);
}

/**
 * 等待挂起的 Keychain 写入完成（仅 iOS）。
 */
export async function flushSessionSave(): Promise<void> {
  if (!USE_KEYCHAIN_PERSIST) {
    return;
  }

  cancelKeychainPersistTimer();
  if (pendingKeychainSession) {
    void drainKeychainQueue();
  }
  await saveChain;
}

/**
 * 同步保存：内存 + AsyncStorage；iOS 额外等待 Keychain。
 */
export async function saveSession(session: StoredSession): Promise<void> {
  sessionCache = session;
  await writeAsyncStorageSession(session);
  scheduleKeychainPersist(session, true);
  await flushSessionSave();
}

export async function getSession(): Promise<StoredSession | null> {
  if (sessionCache !== undefined) {
    return sessionCache;
  }

  try {
    const asyncSession = await readAsyncStorageSession();
    if (asyncSession) {
      sessionCache = asyncSession;
      return asyncSession;
    }

    const legacySession = await migrateFromKeychainOnce();

    if (legacySession) {
      sessionCache = legacySession;
      return legacySession;
    }

    sessionCache = null;
    return null;
  } catch (error) {
    console.error('getSession error:', error);
    sessionCache = null;
    return null;
  }
}

/**
 * 清理 session。
 *
 * 主链路 await AsyncStorage；Keychain 清理后台执行（清理旧版/iOS 残留）。
 */
export async function clearSession(): Promise<void> {
  saveGeneration += 1;
  pendingKeychainSession = null;
  sessionCache = null;
  cancelKeychainPersistTimer();

  try {
    await removeAsyncStorageSession();
  } catch (error) {
    console.error('clearSession asyncStorage error:', error);
    throw error;
  }

  void resetKeychain().catch((error) => {
    console.error('clearSession keychain error:', error);
  });
}
