import { useEffect, useMemo, useRef } from 'react';

export function useThrottledCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait = 300,
) {
  const fnRef = useRef(fn);
  const lastInvokeRef = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  return useMemo(() => {
    return (...args: TArgs) => {
      const now = Date.now();

      if (now - lastInvokeRef.current < wait) {
        return;
      }

      lastInvokeRef.current = now;
      fnRef.current(...args);
    };
  }, [wait]);
}
