import { useCallback, useEffect, useRef, useState } from 'react';

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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await receivingService.getSelectedProductionColor();
      setData(result);
    } finally {
      setLoading(false);
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

export const useProductionColorDetail = (id?: string | null) => {
  const [detail, setDetail] = useState<ProductionColorDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      const result = await receivingService.getProductionColorDetail(id);
      setDetail(result);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, refresh };
};

export const useMaterialConfirmation = (productionColorId?: string) => {
  const [data, setData] = useState<MaterialConfirmationData | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!productionColorId) return;
    setLoading(true);
    try {
      const result = await receivingService.getMaterialConfirmation(productionColorId);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [productionColorId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
};

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

export const useCuttingRecords = (productionColorId?: string) => {
  const [data, setData] = useState<CuttingRecordsData | null>(null);

  const refresh = useCallback(async () => {
    if (!productionColorId) return;
    const result = await receivingService.getCuttingRecords(productionColorId);
    setData(result);
  }, [productionColorId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, refresh };
};

export const useSewingRecords = (productionColorId?: string) => {
  const [data, setData] = useState<SewingRecordsData | null>(null);

  const refresh = useCallback(async () => {
    if (!productionColorId) return;
    const result = await receivingService.getSewingRecords(productionColorId);
    setData(result);
  }, [productionColorId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, refresh };
};

export const usePackingRecords = (productionColorId?: string) => {
  const [data, setData] = useState<PackingRecordsData | null>(null);

  const refresh = useCallback(async () => {
    if (!productionColorId) return;
    const result = await receivingService.getPackingRecords(productionColorId);
    setData(result);
  }, [productionColorId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, refresh };
};

export const useProductionColorSearch = () => {
  const [results, setResults] = useState<ProductionColorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchSeqRef = useRef(0);

  const search = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const seq = ++searchSeqRef.current;
    setLoading(true);

    try {
      const list = await receivingService.searchProductionColors(trimmed);
      if (seq !== searchSeqRef.current) {
        return;
      }
      setResults(list);
      setSearched(true);
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { results, loading, searched, search };
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
