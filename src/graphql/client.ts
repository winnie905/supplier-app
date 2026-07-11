import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { env } from '@/config/env';
import { APP_NAME } from '@/constants/app';
import { useAuthStore } from '@/store/authStore';
import { ProductEnum } from '@/types';
import { buildUserAgent } from '@/utils/app';
import { getSession } from '@/utils/auth/authStorage';
import { findKickedOfflineError, isUnauthorizedGraphQLError } from '@/utils/auth/sessionError';

const GRAPHQL_URL = env.GRAPHQL_URL;
const REQUEST_TIMEOUT_MS = 30_000;

const AUTHORIZATION_PREFIX = 'Bearer';
const HEADER_AUTHORIZATION = 'authorization';
const HEADER_DEVICE_ID = 'x-device-id';
const HEADER_PRODUCT = 'product';
const HEADER_USER_AGENT = 'user-agent';
const HEADER_X_PRODUCT_TYPE = 'x-product-type';

const PRODUCT_TYPE = 'APP';
const ANONYMOUS_OPERATION_NAME = 'anonymous';
const UNKNOWN_DEVICE_ID = 'unknown-device';

/**
 * Apollo context 中的 headers 可能来自任意 link，
 * 类型很容易变成 unknown / any。
 *
 * 这里统一收敛成 Record<string, string>，
 * 避免 header 继续向后“脏传递”。
 */
type SafeHeaders = Record<string, string>;

/**
 * 统一的请求超时错误。
 *
 * 页面层、toast、埋点、Sentry 后续都可以只识别这个类型，
 * 不需要关心底层是 fetch abort 还是其他实现细节。
 */
class RequestTimeoutError extends Error {
  readonly code = 'REQUEST_TIMEOUT';
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`GraphQL request timeout after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

function isRequestTimeoutError(error: unknown): error is RequestTimeoutError {
  return error instanceof RequestTimeoutError;
}

/**
 * 当前先集中打日志。
 * 后续如果要统一 toast、埋点、Sentry，可以只改这里。
 */
function handleTimeoutError(error: RequestTimeoutError, operationName?: string): void {
  console.error(
    `[GraphQL Timeout] ${operationName ?? ANONYMOUS_OPERATION_NAME} exceeded ${error.timeoutMs}ms`,
  );
}

/**
 * 只保留 string 类型的 header。
 * 非 string 的 header 值直接丢弃，避免传出非法 header。
 */
function normalizeHeaders(headers: unknown): SafeHeaders {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }

  const result: SafeHeaders = {};

  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 有 token 才构造 Authorization。
 * 没有 token 时返回 undefined，调用方负责删除 header。
 */
function buildAuthorizationHeader(token?: string | null): string | undefined {
  return token ? `${AUTHORIZATION_PREFIX} ${token}` : undefined;
}

/**
 * 把 Authorization 写入 headers。
 *
 * 关键点：
 * - 有 token：写入 Bearer token
 * - 无 token：删除旧 authorization，避免传空字符串或脏 token
 */
function applyAuthorizationToHeaders(headers: SafeHeaders, token?: string | null): SafeHeaders {
  const nextHeaders: SafeHeaders = { ...headers };
  const authorization = buildAuthorizationHeader(token);

  if (authorization) {
    nextHeaders[HEADER_AUTHORIZATION] = authorization;
  } else {
    delete nextHeaders[HEADER_AUTHORIZATION];
  }

  return nextHeaders;
}

/**
 * ProductEnum 如果是数字 enum，Object.keys 会包含反向映射的数字 key。
 * 这里过滤掉纯数字 key，避免 header 里出现多余值。
 */
const DEFAULT_PRODUCT_HEADER = Object.keys(ProductEnum)
  .filter((key) => Number.isNaN(Number(key)))
  .join(',');

const USER_AGENT = buildUserAgent({
  appName: APP_NAME,
  channel: APP_NAME,
  env: env.APP_ENV,
  includeBundleId: true,
});

/**
 * deviceId 整个 App 生命周期内基本稳定。
 * 走 Promise 缓存，避免每个请求都触发一次原生调用。
 */
let deviceIdPromise: Promise<string> | null = null;

function getDeviceIdCached(): Promise<string> {
  deviceIdPromise ??= DeviceInfo.getUniqueId().catch((error: unknown) => {
    /**
     * 不要因为 deviceId 获取失败导致所有 GraphQL 请求失败。
     * 这里降级为 unknown-device，同时清空缓存，方便下次请求重新尝试。
     */
    console.warn('[GraphQL] Failed to get device id:', error);
    deviceIdPromise = null;
    return UNKNOWN_DEVICE_ID;
  });

  return deviceIdPromise;
}

/**
 * 构建所有请求都要带的公共头。
 *
 * 注意：
 * - product 允许上游 link 覆盖
 * - user-agent / x-product-type / x-device-id 由客户端统一维护
 */
async function buildCommonHeaders(prevHeaders: SafeHeaders): Promise<SafeHeaders> {
  const deviceId = await getDeviceIdCached();

  return {
    ...prevHeaders,
    [HEADER_DEVICE_ID]: deviceId,
    [HEADER_PRODUCT]: prevHeaders[HEADER_PRODUCT] ?? DEFAULT_PRODUCT_HEADER,
    [HEADER_USER_AGENT]: USER_AGENT,
    [HEADER_X_PRODUCT_TYPE]: PRODUCT_TYPE,
  };
}

/**
 * 公共 header 链。
 * loginClient 和业务 apolloClient 都需要走这里。
 */
const commonHeadersLink = new SetContextLink(
  async (prevContext: Readonly<ApolloLink.OperationContext>) => {
    const prevHeaders = normalizeHeaders(prevContext.headers);

    return {
      headers: await buildCommonHeaders(prevHeaders),
    };
  },
);

/**
 * 鉴权 header 链。
 *
 * 只有业务 client 需要挂这个 link。
 * 登录相关请求不应该依赖已有 token。
 */
const authLink = new SetContextLink(async (prevContext: Readonly<ApolloLink.OperationContext>) => {
  const session = await getSession();
  const prevHeaders = normalizeHeaders(prevContext.headers);

  return {
    headers: applyAuthorizationToHeaders(prevHeaders, session?.token),
  };
});

/**
 * 单飞 signOut。
 *
 * 多个接口同时返回 401 时，只允许触发一次退出流程。
 */
let signOutPromise: Promise<void> | null = null;

async function signOutOnce(): Promise<void> {
  signOutPromise ??= useAuthStore
    .getState()
    .signOut()
    .finally(() => {
      signOutPromise = null;
    });

  return signOutPromise;
}

/**
 * 获取 401 自动登出的国际化文案。
 *
 * 注意：
 * 401 弹窗使用硬编码中文文案。
 */
function getUnauthorizedAlertText() {
  return {
    title: '登录已过期',
    message: '为了保障账号安全，请重新登录后继续使用。',
    confirmText: '重新登录',
  };
}

/**
 * 401 弹窗。
 *
 * 用 Promise 包一层，让 Alert 的生命周期可以和 signOut 流程统一管理。
 *
 * 注意：
 * - 是否允许再次弹窗，由 unauthorizedLogoutFlowPromise 统一控制。
 */
function showUnauthorizedAlert(): Promise<void> {
  const { title, message, confirmText } = getUnauthorizedAlertText();

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: confirmText,
          onPress: () => {
            resolve();
          },
        },
      ],
      {
        cancelable: false,
        onDismiss: () => {
          resolve();
        },
      },
    );
  });
}

/**
 * 401 自动登出完整流程单飞。
 *
 * 这个 Promise 覆盖两个生命周期：
 * 1. signOutOnce()：清理本地登录态、跳转登录页等异步操作
 * 2. showUnauthorizedAlert()：用户看到并确认登录过期弹窗
 *
 * 只要这两个流程任意一个还没结束，后续 401 都不再重复弹窗。
 */
let unauthorizedLogoutFlowPromise: Promise<void> | null = null;

function startUnauthorizedLogoutFlowOnce(): Promise<void> {
  if (useAuthStore.getState().isHandlingSessionExpired) {
    return Promise.resolve();
  }

  if (unauthorizedLogoutFlowPromise) {
    return unauthorizedLogoutFlowPromise;
  }

  unauthorizedLogoutFlowPromise = Promise.allSettled([signOutOnce(), showUnauthorizedAlert()])
    .then(() => undefined)
    .finally(() => {
      unauthorizedLogoutFlowPromise = null;
    });

  return unauthorizedLogoutFlowPromise;
}

let kickedOfflineLogoutFlowPromise: Promise<void> | null = null;

function startKickedOfflineLogoutFlowOnce(message: string): Promise<void> {
  if (useAuthStore.getState().isHandlingSessionExpired) {
    return kickedOfflineLogoutFlowPromise ?? Promise.resolve();
  }

  if (kickedOfflineLogoutFlowPromise) {
    return kickedOfflineLogoutFlowPromise;
  }

  kickedOfflineLogoutFlowPromise = useAuthStore
    .getState()
    .handleSessionKickedOffline(message)
    .finally(() => {
      kickedOfflineLogoutFlowPromise = null;
    });

  return kickedOfflineLogoutFlowPromise;
}

/**
 * 登录相关 client 的错误处理。
 *
 * 登录请求不做 token refresh，
 * 也不做 401 自动登出，
 * 只处理公共错误，例如超时。
 */
const commonErrorLink = new ErrorLink(({ error, operation }) => {
  if (isRequestTimeoutError(error)) {
    handleTimeoutError(error, operation.operationName);
  }
});

/**
 * 业务 client 的错误处理。
 *
 * 当前规则：
 * 1. 超时：统一记录
 * 2. 401 且 message 含「其他设备登录」：挤下线流程，登录页 AppModal 提示
 * 3. 其他 401：沿用登录过期 Alert + signOut
 * 4. 不 refresh token
 * 5. 不重放当前请求
 */
const errorLink = new ErrorLink(({ error, operation }) => {
  if (isRequestTimeoutError(error)) {
    handleTimeoutError(error, operation.operationName);
    return;
  }

  const kickedOffline = findKickedOfflineError(error);
  if (kickedOffline) {
    void startKickedOfflineLogoutFlowOnce(kickedOffline.message);
    return;
  }

  const shouldLogout = isUnauthorizedGraphQLError(error);

  if (!shouldLogout) {
    return;
  }

  void startUnauthorizedLogoutFlowOnce();
});

/**
 * 给底层 fetch 增加统一超时。
 *
 * 行为：
 * - 到达 timeoutMs 后主动 abort
 * - 只有“由 timeout 触发的 AbortError”才包装成 RequestTimeoutError
 * - 外部主动 abort 时保留原始 AbortError 语义
 * - finally 中清理定时器和外部 signal 监听
 */
function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (uri, options = {}) => {
    const controller = new AbortController();
    let didTimeout = false;

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);

    const originalSignal = options.signal;

    const abortByExternalSignal = () => {
      controller.abort();
    };

    if (originalSignal) {
      if (originalSignal.aborted) {
        controller.abort();
      } else {
        originalSignal.addEventListener('abort', abortByExternalSignal, { once: true });
      }
    }

    try {
      return await fetch(uri, {
        ...options,
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      if (didTimeout && fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new RequestTimeoutError(timeoutMs);
      }

      throw fetchError;
    } finally {
      clearTimeout(timeoutId);

      if (originalSignal && !originalSignal.aborted) {
        originalSignal.removeEventListener('abort', abortByExternalSignal);
      }
    }
  };
}

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  fetch: createTimeoutFetch(REQUEST_TIMEOUT_MS),
});

/**
 * 业务接口 client。
 *
 * 链路顺序：
 * 1. commonHeadersLink：写入设备、产品、UA 等公共头
 * 2. authLink：写入 Authorization
 * 3. errorLink：处理超时、401 自动退出
 * 4. httpLink：真正发起请求
 */
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([commonHeadersLink, authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
});

/**
 * 登录相关 client。
 *
 * 登录、注册、发送验证码等请求不应该依赖业务 token，
 * 所以这里不挂 authLink，也不挂 401 自动退出逻辑。
 */
export const loginClient = new ApolloClient({
  link: ApolloLink.from([commonHeadersLink, commonErrorLink, httpLink]),
  cache: new InMemoryCache(),
});
