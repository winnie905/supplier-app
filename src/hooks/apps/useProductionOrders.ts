import { useCallback, useEffect, useState } from 'react';

import { useKeywordSearch } from '@/hooks/useKeywordSearch';
import { productionOrderService } from '@/services/apps/productionOrderService';
import type {
  DeliverySortOrder,
  ProductionOrderListResult,
  ProductionOrderTab,
  ProductionOrderView,
} from '@/types/apps';

interface UseProductionOrdersParams {
  /** 搜索框展示用；未选中具体生产单时也可作关键字筛选用 */
  keyword?: string;
  /** 搜索页选中回填的生产单号；有值时统计/列表按单号请求 */
  productionOrderCode?: string;
  tab: ProductionOrderTab;
  sort: DeliverySortOrder;
  enabled?: boolean;
}

export const useProductionOrders = ({
  keyword = '',
  productionOrderCode,
  tab,
  sort,
  enabled = true,
}: UseProductionOrdersParams) => {
  const [data, setData] = useState<ProductionOrderListResult | null>(null);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await productionOrderService.listOrders({
        keyword,
        ...(productionOrderCode ? { productionOrderCode } : {}),
        tab,
        sort,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [enabled, keyword, productionOrderCode, sort, tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
};

export const useProductionOrderSearch = () => {
  const fetcher = useCallback(
    (keyword: string) => productionOrderService.searchOrders(keyword),
    [],
  );
  return useKeywordSearch<ProductionOrderView>(fetcher);
};
