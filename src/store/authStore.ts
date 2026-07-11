import { create } from 'zustand';

import type { AuthState, AuthUser, SignOutOptions } from '@/types';
import {
  clearSession,
  getSession,
  persistSession,
  type StoredSession,
} from '@/utils/auth/authStorage';

const MOCK_USER: AuthUser = {
  avatar: '',
  email: 'supplier@example.com',
  id: 'mock-user-id',
  name: '供应商用户',
  username: 'supplier',
  products: [],
  permissions: {},
  firstName: '供应商',
  lastName: '用户',
};

const buildMockSession = (account: string): StoredSession => {
  const normalizedAccount = account.trim();

  return {
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiredAt: Date.now() + 24 * 60 * 60 * 1000,
    expiresIn: '86400',
    refreshTokenExpiredAt: '',
    refreshTokenExpiresIn: '',
    products: [],
    user: {
      ...MOCK_USER,
      id: `mock-user:${normalizedAccount.toLowerCase()}`,
      email: normalizedAccount.includes('@') ? normalizedAccount : MOCK_USER.email,
      username: normalizedAccount || MOCK_USER.username,
      name: normalizedAccount || MOCK_USER.name,
    },
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
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

  handleSessionKickedOffline: async (message?: string) => {
    set({
      isHandlingSessionExpired: true,
      sessionExpiredMessage: message?.trim() ?? '您的账号已在其他设备登录',
      logoutReason: 'kickedOffline',
    });

    await get().signOut({ skipLogoutRequest: true, reason: 'kickedOffline' });
  },

  getProfile: () => Promise.resolve(get().user ?? null),

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const session = await getSession();

      if (session?.token) {
        set({
          isSignedIn: true,
          user: session.user ?? MOCK_USER,
        });
      } else {
        set({
          isSignedIn: false,
          user: null,
        });
      }
    } catch (error) {
      console.error('restoreSession error:', error);
      set({
        isSignedIn: false,
        user: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (account: string) => {
    set({ isLoading: true });

    try {
      const session = buildMockSession(account.trim());
      persistSession(session);
      await Promise.resolve();
      set({
        isSignedIn: true,
        user: session.user ?? MOCK_USER,
        isLoading: false,
      });
    } catch (error) {
      console.error('signIn error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async (options?: SignOutOptions) => {
    set({
      isSignedIn: false,
      user: null,
      logoutReason: options?.reason ?? 'manual',
    });

    try {
      await clearSession();
    } catch (error) {
      console.error('signOut error:', error);
    }
  },

  getAccessToken: async (session?: StoredSession) => {
    const currentSession = session ?? (await getSession());

    if (!currentSession) {
      throw new Error('No session');
    }

    return currentSession;
  },
}));
