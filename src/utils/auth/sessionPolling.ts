/**
 * 存放登录态保活与生命周期管理：前后台切换时的定时校验、
 * 被踢下线检测等与会话活性相关的逻辑。
 */
import { AppState, type AppStateStatus } from 'react-native';

import { SESSION_CHECK_INTERVAL_MS } from '@/constants/auth';
import { getAuthGeneration, useAuthStore } from '@/store/authStore';
import { getSession, peekSessionCache } from '@/utils/auth/authStorage';
import { findKickedOfflineError } from '@/utils/auth/sessionError';

let sessionCheckTimer: ReturnType<typeof setInterval> | null = null;
let isCheckingSession = false;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let authStoreUnsubscribe: (() => void) | null = null;
let isLifecycleInitialized = false;

const clearSessionCheckTimer = () => {
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = null;
  }
};

export const stopSessionPolling = () => {
  clearSessionCheckTimer();
};

const shouldPollNow = (): boolean => {
  const { isSignedIn } = useAuthStore.getState();
  return isSignedIn && AppState.currentState === 'active';
};

export const checkSessionOnce = async (): Promise<void> => {
  if (isCheckingSession || !shouldPollNow()) {
    return;
  }

  isCheckingSession = true;
  const generation = getAuthGeneration();
  let requestToken: string | null = null;

  try {
    const session = await getSession();

    if (!session?.token || !shouldPollNow()) {
      return;
    }

    requestToken = session.token;
    await useAuthStore.getState().syncPolledProfile();
  } catch (error) {
    const kickedOffline = findKickedOfflineError(error);
    if (!kickedOffline) {
      return;
    }

    if (generation !== getAuthGeneration()) {
      return;
    }

    const currentToken = peekSessionCache()?.token;
    if (!requestToken || !currentToken || currentToken !== requestToken) {
      return;
    }

    await useAuthStore.getState().handleSessionKickedOffline(kickedOffline.message);
  } finally {
    isCheckingSession = false;
  }
};

export const startSessionPolling = () => {
  if (!shouldPollNow()) {
    stopSessionPolling();
    return;
  }

  clearSessionCheckTimer();

  void checkSessionOnce();

  sessionCheckTimer = setInterval(() => {
    void checkSessionOnce();
  }, SESSION_CHECK_INTERVAL_MS);
};

const handleAppStateChange = (nextState: AppStateStatus) => {
  if (nextState === 'active') {
    if (shouldPollNow()) {
      startSessionPolling();
    }
    return;
  }

  if (nextState === 'background' || nextState === 'inactive') {
    stopSessionPolling();
  }
};

const syncPollingWithAuthState = (isSignedIn: boolean) => {
  if (!isSignedIn) {
    stopSessionPolling();
    return;
  }

  if (AppState.currentState === 'active') {
    startSessionPolling();
  }
};

/**
 * 绑定登录态与 App 前后台，统一管理 session 轮询生命周期。
 * 在 App 根组件 mount 时调用一次即可。
 */
export const initSessionPollingLifecycle = (): (() => void) => {
  if (isLifecycleInitialized) {
    return () => undefined;
  }

  isLifecycleInitialized = true;

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  authStoreUnsubscribe = useAuthStore.subscribe((state, previousState) => {
    if (state.isSignedIn === previousState.isSignedIn) {
      return;
    }

    syncPollingWithAuthState(state.isSignedIn);
  });

  syncPollingWithAuthState(useAuthStore.getState().isSignedIn);

  return () => {
    stopSessionPolling();
    appStateSubscription?.remove();
    appStateSubscription = null;
    authStoreUnsubscribe?.();
    authStoreUnsubscribe = null;
    isLifecycleInitialized = false;
  };
};
