import { useEffect, useState } from 'react';

import { checkAppVersion } from '@/services/version/versionService';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCareModeStore } from '@/store/careModeStore';
import type { VersionCheckResponse } from '@/types/version';
import { logger } from '@/utils/app';
import { setCareModeFontBoostEnabled } from '@/utils/careMode/fontBoost';

type BootstrapState =
  | { type: 'checking' }
  | { type: 'allow' }
  | { type: 'force_update'; policy: VersionCheckResponse }
  | { type: 'error'; message: string };

export const useAppInitialization = () => {
  const isReady = useAppStore((state) => state.isReady);
  const setReady = useAppStore((state) => state.setReady);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [versionState, setVersionState] = useState<BootstrapState>({ type: 'checking' });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        /**
         * 先做版本检查
         * 命中强更时，直接停在强更页，不恢复首页业务流
         * 有新版本但不强制时，静默放行，不弹窗提示
         */
        const versionDecision = await checkAppVersion();
        if (versionDecision.type === 'force_update') {
          setVersionState({
            type: 'force_update',
            policy: versionDecision.payload,
          });
          return;
        }
        setVersionState({ type: 'allow' });
        await useCareModeStore.getState().hydrate();
        setCareModeFontBoostEnabled(useCareModeStore.getState().enabled);
        await restoreSession();
      } catch (error) {
        logger.info('App bootstrap failed', error);
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [restoreSession, setReady]);

  return { isReady, versionState };
};
