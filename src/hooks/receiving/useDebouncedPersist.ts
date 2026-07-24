import { useCallback, useEffect, useRef } from 'react';

/**
 * 本地立即更新由调用方 setState；此处仅 debounce 持久化。
 * 卸载或 flush 时会写入最后一次待落盘数据。
 */
export const useDebouncedPersist = <TArgs extends unknown[]>(
  persistFn: (...args: TArgs) => Promise<void>,
  delayMs = 400,
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<TArgs | null>(null);
  const persistFnRef = useRef(persistFn);
  persistFnRef.current = persistFn;

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    await persistFnRef.current(...pending);
  }, []);

  const schedule = useCallback(
    (...args: TArgs) => {
      pendingRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void flush();
      }, delayMs);
    },
    [delayMs, flush],
  );

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  return { schedule, flush };
};
