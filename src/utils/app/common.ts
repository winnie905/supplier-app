/**
 * 存放应用级、跨页面通用的平台与配置工具：日志、安全区与布局常量、
 * HTTP 请求头、本地运行时配置、资源 URL 拼接等。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, StatusBar } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { env } from '@/config/env';
import { COMPRESS_DIRECTORY_NAME, ORIGINAL_MAP_CATALOG_NAME } from '@/constants/app';
import { useRuntimeConfigStore } from '@/store/runtimeConfigStore';

const shouldLog = env.APP_ENV === 'dev';

export const logger = {
  info: (...messages: unknown[]) => {
    if (shouldLog) {
      console.log(...messages);
    }
  },
};

/** 与 Stack Header 返回按钮行高一致 */
export const STACK_HEADER_TOOLBAR_HEIGHT = 44;

export const getSafeAreaTopInset = (insetsTop: number): number => {
  if (Platform.OS === 'android') {
    return Math.max(insetsTop, StatusBar.currentHeight ?? 0);
  }

  return insetsTop;
};

interface BuildUserAgentOptions {
  appName?: string;
  channel?: string;
  env?: string;
  includeBundleId?: boolean;
}

export function buildUserAgent(options: BuildUserAgentOptions = {}) {
  const { appName = 'APEX', channel, env: envName, includeBundleId = false } = options;

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();
  const systemName = DeviceInfo.getSystemName();
  const systemVersion = DeviceInfo.getSystemVersion();
  const bundleId = DeviceInfo.getBundleId();

  const isAndroid = systemName.toLowerCase() === 'android';
  const isIOS = systemName.toLowerCase() === 'ios' || systemName.toLowerCase() === 'iphone os';

  const platformPart = isAndroid
    ? `Linux; Android ${systemVersion}`
    : isIOS
      ? `iPhone; CPU iPhone OS ${systemVersion.replace(/\./g, '_')} like Mac OS X`
      : `${systemName} ${systemVersion}`;

  const appPart = [
    `${appName}/${appVersion}`,
    `Build/${buildNumber}`,
    channel ? `Channel/${channel}` : '',
    envName ? `Env/${envName}` : '',
    includeBundleId ? `Bundle/${bundleId}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `Mozilla/5.0 (${platformPart}) AppleWebKit/537.36 (KHTML, like Gecko) Mobile ${appPart}`;
}

const RUNTIME_CONFIG_STORAGE_KEY = 'supplier-app.runtime-config';

interface RuntimeConfig {
  filePrefix: string;
  updatedAt: number;
}

const isRuntimeConfig = (value: unknown): value is RuntimeConfig => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as RuntimeConfig;

  return (
    typeof item.filePrefix === 'string' &&
    item.filePrefix.trim().length > 0 &&
    typeof item.updatedAt === 'number'
  );
};

export const getRuntimeConfigStorage = async (): Promise<RuntimeConfig | null> => {
  try {
    const raw = await AsyncStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isRuntimeConfig(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveRuntimeConfigStorage = async (config: RuntimeConfig | null): Promise<void> => {
  if (!config) {
    await AsyncStorage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const trimEndSlash = (value: string): string => value.replace(/\/+$/, '');

const trimStartSlash = (value: string): string => value.replace(/^\/+/, '');

const DEFAULT_FILE_PREFIX = 'https://apex-erp.s3.cn-northwest-1.amazonaws.com.cn';

/**
 * 拼接资源访问 URL（与 apex-app 对齐）。
 * - 空路径 → ''
 * - 已是 http(s) → 原样返回
 * - 相对路径 → filePrefix + path
 * - original: true → 将压缩目录 `user-assets` 替换为原图目录 `original-assets`
 */
export const buildFileUrl = (
  serverPath?: string | null,
  options?: { original?: boolean },
): string => {
  const { original = false } = options ?? {};

  if (!serverPath) {
    return '';
  }

  let path = serverPath.trim();

  if (!path) {
    return '';
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const filePrefix = useRuntimeConfigStore.getState().config?.filePrefix ?? DEFAULT_FILE_PREFIX;

  if (original) {
    path = path.replace(COMPRESS_DIRECTORY_NAME, ORIGINAL_MAP_CATALOG_NAME);
  }

  return `${trimEndSlash(filePrefix)}/${trimStartSlash(path)}`;
};
