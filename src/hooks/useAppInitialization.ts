import { useEffect } from 'react';

import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCareModeStore } from '@/store/careModeStore';
import { logger } from '@/utils/app';
import { setCareModeFontBoostEnabled } from '@/utils/careMode/fontBoost';

export const useAppInitialization = () => {
  const isReady = useAppStore((state) => state.isReady);
  const setReady = useAppStore((state) => state.setReady);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
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

  return { isReady };
};
