/**
 * 存放访问令牌的时效判断、自动刷新调度及与 auth store 的联动逻辑。
 */
import { useAuthStore } from '@/store/authStore';

import { getSession } from './authStorage';

export function isAccessTokenExpired(expiresAt?: number | null): boolean {
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= expiresAt;
}

let expiredTimer: ReturnType<typeof setTimeout> | null = null;

export function clearTokenExpiredTimer() {
  if (expiredTimer) {
    clearTimeout(expiredTimer);
    expiredTimer = null;
  }
}

export function scheduleTokenRefresh(expiresAt?: number | null) {
  clearTokenExpiredTimer();

  if (!expiresAt) {
    void handleTokenExpired();
    return;
  }

  const currentTime = Date.now();
  const refreshOffset = 10 * 60 * 1000; // 提前 10 分钟刷新
  const refreshAt = expiresAt - refreshOffset;
  const delay = refreshAt - currentTime;

  if (expiresAt <= currentTime) {
    void handleTokenExpired();
    return;
  }

  if (delay <= 0) {
    void refreshAccessToken();
    return;
  }

  expiredTimer = setTimeout(() => {
    void refreshAccessToken();
  }, delay);
}

async function handleTokenExpired() {
  clearTokenExpiredTimer();

  const { signOut } = useAuthStore.getState();
  await signOut();
}

async function refreshAccessToken() {
  try {
    const session = await getSession();
    const { getAccessToken } = useAuthStore.getState();
    if (!session) {
      await handleTokenExpired();
      return;
    }
    await getAccessToken();
  } catch (error) {
    console.error('refreshAccessToken error:', error);
    await handleTokenExpired();
  }
}
