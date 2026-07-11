import { useCallback, useRef } from 'react';

export const useDebouncedSubmit = (delayMs = 600) => {
  const lockedRef = useRef(false);

  const run = useCallback(
    async (action: () => Promise<void> | void) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      try {
        await action();
      } finally {
        setTimeout(() => {
          lockedRef.current = false;
        }, delayMs);
      }
    },
    [delayMs],
  );

  return run;
};
