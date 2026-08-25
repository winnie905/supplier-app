import { useCallback, useEffect, useState } from 'react';

import { createResourceHook } from '@/hooks/createResourceHook';
import { useKeywordSearch } from '@/hooks/useKeywordSearch';
import { receivingService } from '@/services/receiving/receivingService';
import type {
  CuttingRecordsData,
  FactoryException,
  MaterialConfirmationData,
  PackingRecordsData,
  ProductionColorDetail,
  ProductionColorSummary,
  SewingRecordsData,
} from '@/types/receiving';

export const useSelectedProductionColor = () => {
  const [data, setData] = useState<ProductionColorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const result = await receivingService.getSelectedProductionColor({
        ...(options?.force ? { force: true } : {}),
      });
      setData(result);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const select = useCallback(async (id: string) => {
    const result = await receivingService.selectProductionColor(id);
    setData(result);
    return result;
  }, []);

  const clear = useCallback(async () => {
    await receivingService.clearSelectedProductionColor();
    setData(null);
  }, []);

  return { data, loading, refresh, select, clear };
};

const useProductionColorDetailResource = createResourceHook<ProductionColorDetail | null>((id) =>
  receivingService.getProductionColorDetail(id),
);

export const useProductionColorDetail = (id?: string | null) => {
  const { data, loading, refresh } = useProductionColorDetailResource(id);
  return { detail: data ?? null, loading, refresh };
};

export const useMaterialConfirmation = createResourceHook<MaterialConfirmationData>((id) =>
  receivingService.getMaterialConfirmation(id),
);

export const useFactoryExceptions = (
  productionColorId?: string,
  module?: 'material' | 'cutting',
) => {
  const [items, setItems] = useState<FactoryException[]>([]);

  const refresh = useCallback(async () => {
    if (!productionColorId) return;
    const result = await receivingService.getFactoryExceptions(productionColorId, module);
    setItems(result);
  }, [productionColorId, module]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = items.filter((item) => item.status === 'pending').length;

  return { items, pendingCount, refresh };
};

export const useCuttingRecords = createResourceHook<CuttingRecordsData>(
  (id) => receivingService.getCuttingRecords(id),
  { withLoading: false },
);

export const useSewingRecords = createResourceHook<SewingRecordsData>(
  (id) => receivingService.getSewingRecords(id),
  { withLoading: false },
);

export const usePackingRecords = createResourceHook<PackingRecordsData>(
  (id) => receivingService.getPackingRecords(id),
  { withLoading: false },
);

export const useProductionColorSearch = () => {
  const fetcher = useCallback(
    (keyword: string) => receivingService.searchProductionColors(keyword),
    [],
  );
  return useKeywordSearch<ProductionColorSummary>(fetcher);
};

export const useQrCodeResolve = () => {
  const [resolving, setResolving] = useState(false);

  const resolve = useCallback(async (content: string) => {
    setResolving(true);
    try {
      return await receivingService.resolveQrCode(content);
    } finally {
      setResolving(false);
    }
  }, []);

  return { resolve, resolving };
};
