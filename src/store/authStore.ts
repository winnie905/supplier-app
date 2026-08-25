import { create } from 'zustand';

import { DEFAULT_SESSION_KICKED_OFFLINE_MESSAGE } from '@/constants/auth';
import {
  getAccessToken as requestAccessToken,
  getUserInfo,
  logout,
} from '@/services/auth/authService';
import { getAssetHost } from '@/services/config/configService';
import { useRuntimeConfigStore } from '@/store/runtimeConfigStore';
import type { ActiveRefreshAccessToken, AuthState, AuthUser, SignOutOptions } from '@/types';
import {
  clearSession,
  getSession,
  persistSession,
  setSessionCache,
  type StoredSession,
} from '@/utils/auth/authStorage';
import { convertPermission } from '@/utils/auth/roles';
import {
  buildProductParam,
  findKickedOfflineError,
  isUnauthorizedGraphQLError,
} from '@/utils/auth/sessionError';
import { stopSessionPolling } from '@/utils/auth/sessionPolling';
import { isAccessTokenExpired, scheduleTokenRefresh } from '@/utils/auth/token';

/**
 * 从调用方或本地安全存储解析当前 session。
 *
 * 1. 调用方显式传入的 session
 * 2. 本地安全存储中的 session
 */
const resolveSession = async (sessionFromCaller?: StoredSession): Promise<StoredSession> => {
  const session = sessionFromCaller ?? (await getSession());

  if (!session) {
    throw new Error('No session');
  }

  return session;
};

/**
 * 当前认证链路版本号。
 *
 * 用途：
 * - restoreSession / signIn / getProfile / refreshAccessToken 都可能存在异步请求；
 * - 如果请求返回前用户已经 signOut，旧请求不能再 commitSession；
 * - 每次开启新的认证主流程或清理登录态时递增版本号，让旧任务自动失效。
 */
let authGeneration = 0;

const nextAuthGeneration = () => {
  authGeneration += 1;
  return authGeneration;
};

export const getAuthGeneration = () => authGeneration;

const isSameAuthGeneration = (generation: number) => generation === authGeneration;

type AuthFlowGuard = () => boolean;

interface CommitSessionOptions {
  /**
   * 是否持久化到磁盘。
   * persist=false 时只更新 Zustand 和内存 sessionCache，避免关键链路重复 I/O。
   */
  persist?: boolean;

  /**
   * 提交登录态前的有效性检查。
   * 用于防止旧异步任务在用户退出登录后重新写入旧 session。
   */
  shouldCommit?: AuthFlowGuard;

  /**
   * 是否把当前会话激活为已登录（切业务导航、启动轮询）。
   * 登录换票期间必须为 false，避免用临时 token 先打开业务页。
   */
  activateSession?: boolean;
}

const canCommitAuthState = (shouldCommit?: AuthFlowGuard) => !shouldCommit || shouldCommit();

/**
 * 创建新的认证主流程保护器。
 *
 * 适合：
 * - restoreSession
 * - signIn
 *
 * 这些流程开始时应该让旧流程失效。
 */
const createNewAuthFlowGuard = (): AuthFlowGuard => {
  const generation = nextAuthGeneration();

  return () => isSameAuthGeneration(generation);
};

/**
 * 基于当前认证版本创建保护器。
 *
 * 适合：
 * - getProfile
 * - getAccessToken
 *
 * 这些流程不一定代表新的登录主流程，但如果期间发生 signOut，
 * 也不能继续提交旧登录态。
 */
const createCurrentAuthFlowGuard = (): AuthFlowGuard => {
  const generation = getAuthGeneration();

  return () => isSameAuthGeneration(generation);
};

let activeSignOut: Promise<void> | null = null;
let activeSessionExpiredHandling: Promise<void> | null = null;
let activeRefreshAccessToken: ActiveRefreshAccessToken | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  /**
   * 清理本地登录态。
   *
   * 注意：
   * 这里会递增 authGeneration，让所有仍在飞行中的认证异步任务失效。
   * 否则旧的 syncProfile / refreshAccessToken 返回后可能把用户重新拉回登录态。
   */
  const resetAuthState = (options?: Pick<SignOutOptions, 'reason'>) => {
    nextAuthGeneration();
    stopSessionPolling();

    set({
      isSignedIn: false,
      user: null,
      isLoading: false,
      logoutReason: options?.reason ?? null,
    });

    void clearSession().catch((error) => {
      console.error('clearSession error:', error);
    });
  };

  /**
   * 登录态建立成功后的全局初始化任务。
   */
  const bootstrapAuthenticatedResources = async () => {
    try {
      await useRuntimeConfigStore.getState().restoreRuntimeConfig();
      await getAssetHost();
    } catch (error) {
      console.error('bootstrapAuthenticatedResources error:', error);
    }
  };

  /**
   * 给 user 补充前端权限字段。
   */
  const buildSessionWithPermissions = (
    session: StoredSession,
    user: StoredSession['user'],
  ): StoredSession => {
    if (!user) {
      return {
        ...session,
        user: null,
      };
    }

    return {
      ...session,
      user: {
        ...user,
        permissions: convertPermission(user.products ?? session.products ?? []),
      },
    };
  };

  /**
   * 仅更新 Zustand，不写磁盘。
   *
   * 用于冷启动恢复：
   * - 先让导航和首屏尽快可用；
   * - 再后台同步用户信息和权限。
   */
  const hydrateSession = (
    session: StoredSession,
    options?: Pick<CommitSessionOptions, 'shouldCommit'>,
  ) => {
    if (!canCommitAuthState(options?.shouldCommit)) {
      return false;
    }

    set({
      isSignedIn: Boolean(session.token),
      user: session.user ?? null,
    });

    if (session.expiredAt) {
      scheduleTokenRefresh(session.expiredAt);
    }
    return true;
  };

  /**
   * 统一提交 session。
   *
   * 这是所有“写入登录态”的关键入口，因此必须支持 shouldCommit 守卫。
   * 如果异步任务已经过期，必须直接丢弃，不能 set Zustand，也不能写 sessionCache。
   */
  const commitSession = (session: StoredSession, options?: CommitSessionOptions) => {
    if (!canCommitAuthState(options?.shouldCommit)) {
      return false;
    }

    const activateSession = options?.activateSession !== false;

    if (activateSession) {
      set({
        isSignedIn: Boolean(session.token),
        user: session.user ?? null,
      });

      if (session.expiredAt) {
        scheduleTokenRefresh(session.expiredAt);
      }
    }

    if (!canCommitAuthState(options?.shouldCommit)) {
      return false;
    }

    if (options?.persist === false) {
      setSessionCache(session);
      return true;
    }

    persistSession(session);
    return true;
  };

  /**
   * 拉取用户信息，并把 permissions 写回本地 session。
   *
   * 关键点：
   * getUserInfo 是异步请求，请求返回后必须先检查 shouldCommit。
   * 如果用户已经退出登录，本次结果必须丢弃，不能 commitSession。
   */
  const syncProfile = async (
    session: StoredSession,
    options?: CommitSessionOptions,
  ): Promise<AuthUser | null> => {
    const product = buildProductParam(session.products);
    const userInfo = await getUserInfo(product);

    if (!canCommitAuthState(options?.shouldCommit)) {
      return null;
    }

    const nextUser = userInfo ?? session.user ?? null;
    const nextSession = buildSessionWithPermissions(session, nextUser);

    const committed = commitSession(nextSession, options);

    if (!committed) {
      return null;
    }

    return nextUser ?? null;
  };

  const requestRefreshedSession = async (session?: StoredSession): Promise<StoredSession> => {
    const currentSession = await resolveSession(session);

    if (!currentSession.refreshToken) {
      throw new Error('No refresh token');
    }

    if (activeRefreshAccessToken?.refreshToken === currentSession.refreshToken) {
      return activeRefreshAccessToken.promise;
    }

    const refreshPromise = (async () => {
      const product = buildProductParam(currentSession.products);
      const tokenResult = await requestAccessToken(product, currentSession.refreshToken);

      if (!tokenResult) {
        throw new Error('Refresh access token failed');
      }

      return {
        ...currentSession,
        ...tokenResult,
      };
    })().finally(() => {
      if (activeRefreshAccessToken?.promise === refreshPromise) {
        activeRefreshAccessToken = null;
      }
    });

    activeRefreshAccessToken = {
      refreshToken: currentSession.refreshToken,
      promise: refreshPromise,
    };

    return refreshPromise;
  };

  /**
   * 使用 refreshToken 换新的 accessToken。
   * 换票只更新 token 字段；保留期间可能已被 syncProfile 写入的最新 user（含 supplier）。
   */
  const refreshAccessToken = async (
    session?: StoredSession,
    options?: CommitSessionOptions,
  ): Promise<StoredSession> => {
    const nextSession = await requestRefreshedSession(session);

    if (!canCommitAuthState(options?.shouldCommit)) {
      return nextSession;
    }

    const latest = await getSession();
    const mergedSession: StoredSession = {
      ...nextSession,
      user: latest?.user ?? get().user ?? nextSession.user ?? null,
    };

    commitSession(mergedSession, options);

    return mergedSession;
  };

  /**
   * 冷启动后台换票：刷新 accessToken 有效期，不阻塞首屏。
   * - 成功：commitSession + persist，并重新 scheduleTokenRefresh
   * - 401：立即退出（与 ErrorLink 互为兜底）
   * - 其他错误：保持登录，继续用本地未过期 token
   */
  const refreshAccessTokenOnColdStart = async (
    session: StoredSession,
    options?: CommitSessionOptions,
  ): Promise<void> => {
    try {
      await refreshAccessToken(session, {
        ...options,
        persist: true,
      });
    } catch (error) {
      if (!canCommitAuthState(options?.shouldCommit)) {
        return;
      }

      const kickedOffline = findKickedOfflineError(error);
      if (kickedOffline) {
        await get().handleSessionKickedOffline(kickedOffline.message);
        return;
      }

      if (isUnauthorizedGraphQLError(error)) {
        await get().handleSessionExpired({
          reason: 'expired',
          skipLogoutRequest: true,
        });
        return;
      }

      console.error('refreshAccessTokenOnColdStart error:', error);
    }
  };

  return {
    isLoading: true,
    isSignedIn: false,
    user: null,
    sessionExpiredMessage: null,
    logoutReason: null,
    isHandlingSessionExpired: false,

    consumeSessionExpiredMessage: () => {
      const message = get().sessionExpiredMessage;

      if (!message) {
        return undefined;
      }

      set({
        sessionExpiredMessage: null,
        isHandlingSessionExpired: false,
      });

      return message;
    },

    handleSessionExpired: async (options) => {
      if (get().isHandlingSessionExpired) {
        if (activeSessionExpiredHandling) {
          return activeSessionExpiredHandling;
        }
        return;
      }

      const reason = options?.reason ?? 'expired';

      set({
        isHandlingSessionExpired: true,
        sessionExpiredMessage: DEFAULT_SESSION_KICKED_OFFLINE_MESSAGE,
        logoutReason: reason,
      });

      stopSessionPolling();

      activeSessionExpiredHandling = get()
        .signOut({
          skipLogoutRequest: options?.skipLogoutRequest ?? true,
          reason,
        })
        .finally(() => {
          activeSessionExpiredHandling = null;
        });

      return activeSessionExpiredHandling;
    },

    handleSessionKickedOffline: async (message?: string) => {
      return get().handleSessionExpired({
        ...(message ? { message } : {}),
        reason: 'kickedOffline',
        skipLogoutRequest: true,
      });
    },
    /**
     * 获取当前用户信息。
     */
    getProfile: async (session?: StoredSession) => {
      const shouldCommit = createCurrentAuthFlowGuard();

      try {
        const currentSession = session ?? (await getSession());

        if (!currentSession || !shouldCommit()) {
          return null;
        }

        return (await syncProfile(currentSession, { shouldCommit })) ?? null;
      } catch (error) {
        if (shouldCommit()) {
          console.error('getProfile error:', error);
        }
        return null;
      } finally {
        if (shouldCommit()) {
          set({ isLoading: false });
        }
      }
    },

    /**
     * App 冷启动恢复登录态。只根据本地 session 判断登录状态。
     *
     * 当前策略：
     * 1. 本地没有 session：进入未登录态
     * 2. accessToken 已过期：直接清理本地登录态，不再 refreshToken
     * 3. accessToken 未过期：恢复 session
     * 4. 恢复成功后后台并行：换票（刷新 expiredAt）+ 同步用户信息
     */
    restoreSession: async () => {
      const shouldCommit = createNewAuthFlowGuard();

      set({ isLoading: true });

      try {
        const localSession = await getSession();
        if (!shouldCommit()) {
          return;
        }

        if (!localSession) {
          set({
            user: null,
            isSignedIn: false,
            isLoading: false,
          });
          return;
        }

        /**
         * 冷启动时如果 accessToken 已过期，直接退出登录。
         */
        if (isAccessTokenExpired(localSession.expiredAt)) {
          resetAuthState();
          return;
        }

        /**
         * token 未过期：
         * 1. 先 hydrate Zustand，让导航和首屏尽快可用；
         * 2. 后台并行换票 + 同步用户信息和权限；
         * 3. 如果同步期间用户退出登录，本次结果会被 shouldCommit 丢弃。
         */
        const hydrated = hydrateSession(localSession, { shouldCommit });

        if (!hydrated) {
          return;
        }

        void refreshAccessTokenOnColdStart(localSession, { shouldCommit });

        void syncProfile(localSession, { persist: false, shouldCommit })
          .then(async () => {
            if (!shouldCommit()) {
              return;
            }

            const cachedSession = await getSession();

            if (!shouldCommit()) {
              return;
            }

            if (cachedSession) {
              persistSession(cachedSession);
            }

            if (shouldCommit()) {
              void bootstrapAuthenticatedResources();
            }
          })
          .catch((error) => {
            if (shouldCommit()) {
              console.error('syncProfile error:', error);
            }
          });
      } catch (error) {
        if (shouldCommit()) {
          console.error('restoreSession error:', error);
          resetAuthState();
        }
      } finally {
        if (shouldCommit()) {
          set({ isLoading: false });
        }
      }
    },

    /**
     * 登录。
     *
     * 登录接口返回的是临时 accessToken + refreshToken。
     * 必须先换到正式 accessToken，再 commit / 置 isSignedIn。
     * 若先用临时 token 切回业务页，页面会立刻发请求；换票成功后旧 token
     * 失效，这些在途请求会 401，刚登入又被挤下线。
     */
    signIn: async (session: StoredSession) => {
      const shouldCommit = createNewAuthFlowGuard();

      set({
        isLoading: true,
        sessionExpiredMessage: null,
        isHandlingSessionExpired: false,
        logoutReason: null,
      });

      try {
        if (!shouldCommit()) {
          return;
        }

        setSessionCache(session);

        const nextSession = await refreshAccessToken(session, {
          persist: false,
          shouldCommit,
          activateSession: false,
        });

        if (!shouldCommit()) {
          return;
        }

        await syncProfile(nextSession, {
          persist: false,
          shouldCommit,
          activateSession: false,
        });

        if (!shouldCommit()) {
          return;
        }

        const cachedSession = await getSession();

        if (!shouldCommit()) {
          return;
        }

        if (cachedSession) {
          commitSession(cachedSession, { shouldCommit });
        }

        if (shouldCommit()) {
          void bootstrapAuthenticatedResources();
        }
      } catch (error) {
        if (!shouldCommit()) {
          return;
        }

        console.error('signIn error:', error);
        resetAuthState();
        throw error;
      } finally {
        if (shouldCommit()) {
          set({ isLoading: false });
        }
      }
    },

    /**
     * 退出登录。
     *
     * 注意：
     * 1. 退出登录一开始就递增 authGeneration，让所有旧异步任务立即失效；
     * 2. username 必须在清理 session 前取出；
     * 3. logout API 必须在 resetAuthState 前发出，否则 authLink 可能无法带上 token；
     * 4. activeSignOut 用于防止用户连续点击导致重复退出。
     */
    signOut: async (options?: SignOutOptions) => {
      if (activeSignOut) {
        return activeSignOut;
      }

      /**
       * 用户主动退出时，立即让 restoreSession / syncProfile / refreshAccessToken
       * 等仍在飞行中的认证任务失效，避免旧请求返回后复活登录态。
       */
      nextAuthGeneration();
      stopSessionPolling();

      activeSignOut = (async () => {
        const session = await getSession();
        const username = session?.user?.username ?? '';

        try {
          if (!options?.skipLogoutRequest && username) {
            await logout(username);
          }
        } catch (error) {
          console.error('logout error:', error);
        } finally {
          resetAuthState({ reason: options?.reason ?? 'manual' });
        }
      })().finally(() => {
        activeSignOut = null;
      });

      return activeSignOut;
    },

    /**
     * 对外暴露给 Apollo errorLink 的刷新 token 方法。
     *
     * 如果刷新过程中用户退出登录，refreshAccessToken 会因为 shouldCommit 失效而
     * 不再提交旧 token，避免和主动退出登录互相打架。
     */
    getAccessToken: async (session?: StoredSession) => {
      const shouldCommit = createCurrentAuthFlowGuard();

      return refreshAccessToken(session, { shouldCommit });
    },
  };
});
