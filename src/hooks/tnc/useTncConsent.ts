import { useCallback, useEffect, useState } from 'react';

import { tncService } from '@/services/tnc/tncService';
import type { TncCheckResult, TncVersion } from '@/types/tnc';

interface UseTncConsentOptions {
  /** 可选；未登录时用账号临时 id 做首次/换版落库判断 */
  userId?: string | null;
  enabled?: boolean;
}

/**
 * 登录页协议同意：
 * - 每次登录都弹窗
 * - 仅首次 / 版本更新后首次才 persist
 */
export const useTncConsent = ({ userId, enabled = true }: UseTncConsentOptions) => {
  const [checkResult, setCheckResult] = useState<TncCheckResult | null>(null);
  const [currentVersions, setCurrentVersions] = useState<TncVersion[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCheckResult(null);
      return null;
    }

    setIsChecking(true);
    setError(null);

    try {
      const versions = await tncService.getCurrentVersions();
      setCurrentVersions(versions);

      if (!userId) {
        setCheckResult(null);
        return null;
      }

      const result = await tncService.checkConsentStatus(userId);
      setCheckResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '协议状态检查失败';
      setError(message);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const confirmConsent = useCallback(async () => {
    if (!userId) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await tncService.confirmLoginConsent(userId);
      const result = await tncService.checkConsentStatus(userId);
      setCheckResult(result);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '协议同意提交失败';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [userId]);

  return {
    checkResult,
    needPersistConsent: checkResult?.needPersistConsent ?? true,
    requiredVersions: checkResult?.requiredVersions ?? currentVersions,
    currentVersions,
    isChecking,
    isSubmitting,
    error,
    refresh,
    confirmConsent,
  };
};
