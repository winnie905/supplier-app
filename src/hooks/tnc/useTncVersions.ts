import { useEffect, useState } from 'react';

import { tncService } from '@/services/tnc/tncService';
import type { TncVersion } from '@/types/tnc';

export const useTncVersions = () => {
  const [versions, setVersions] = useState<TncVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await tncService.getCurrentVersions();
        if (!cancelled) {
          setVersions(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '协议加载失败');
          setVersions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const userAgreement = versions.find((item) => item.type === 'USER_AGREEMENT');
  const privacyPolicy = versions.find((item) => item.type === 'PRIVACY_POLICY');

  return {
    versions,
    userAgreement,
    privacyPolicy,
    loading,
    error,
  };
};
