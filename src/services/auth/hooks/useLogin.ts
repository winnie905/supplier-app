import { useCallback, useState } from 'react';

import * as authService from '@/services/auth/authService';
import { useAuthStore } from '@/store/authStore';
import type { LoginWithOtpMutationInput, SendOtpMutationInput } from '@/types/auth';

/**
 * 登录页专用 hook：
 * - 暴露 loading / error
 * - 串起 authService + authStore.signIn
 * - 页面只管调用，不关心内部网络细节
 */
export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 统一执行器：
   * - 打开 loading
   * - 清空上一次错误
   * - 捕获错误并转成 message
   */
  const runWithLoading = useCallback(async <T>(task: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setErrorMessage('');

    try {
      return await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 发送邮箱验证码
   */
  const sendOtpCode = useCallback(
    (params: SendOtpMutationInput) => {
      return runWithLoading(() => authService.sendOtpCode(params));
    },
    [runWithLoading],
  );

  /**
   * 验证码登录
   */
  const loginByOtp = useCallback(
    async (input: LoginWithOtpMutationInput) => {
      return runWithLoading(async () => {
        const session = await authService.loginWithOtp(input);
        await signIn(session);
        return session;
      });
    },
    [runWithLoading, signIn],
  );

  return {
    loading,
    errorMessage,
    sendOtpCode,
    loginByOtp,
  };
}
