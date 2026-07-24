import { useCallback, useEffect, useState } from 'react';

interface ResourceHookResultWithLoading<T> {
  data: T | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

interface ResourceHookResult<T> {
  data: T | null;
  refresh: () => Promise<void>;
}

/**
 * 按 productionColorId 拉取资源的同构 hook 工厂。
 * loading 默认开启；无 loading 需求时可传 `{ withLoading: false }`。
 */
export function createResourceHook<T>(
  fetcher: (productionColorId: string) => Promise<T>,
  options: { withLoading: false },
): (productionColorId?: string | null) => ResourceHookResult<T>;
export function createResourceHook<T>(
  fetcher: (productionColorId: string) => Promise<T>,
  options?: { withLoading?: true },
): (productionColorId?: string | null) => ResourceHookResultWithLoading<T>;
export function createResourceHook<T>(
  fetcher: (productionColorId: string) => Promise<T>,
  options?: { withLoading?: boolean },
) {
  const withLoading = options?.withLoading ?? true;

  return (productionColorId?: string | null) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
      if (!productionColorId) {
        setData(null);
        return;
      }
      if (withLoading) setLoading(true);
      try {
        const result = await fetcher(productionColorId);
        setData(result);
      } finally {
        if (withLoading) setLoading(false);
      }
    }, [productionColorId]);

    useEffect(() => {
      void refresh();
    }, [refresh]);

    if (withLoading) {
      return { data, loading, refresh };
    }
    return { data, refresh };
  };
}
