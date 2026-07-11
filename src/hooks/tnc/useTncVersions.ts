import { useEffect, useState } from 'react';

import { tncService } from '@/services/tnc/tncService';
import type { TncVersion } from '@/types/tnc';

export const useTncVersions = () => {
  const [versions, setVersions] = useState<TncVersion[]>([]);

  useEffect(() => {
    let cancelled = false;

    void tncService.getCurrentVersions().then((result) => {
      if (!cancelled) {
        setVersions(result);
      }
    });

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
  };
};
