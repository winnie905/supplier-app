import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useKeywordSearch } from '@/hooks/useKeywordSearch';
import { buildTabStatsFromStatistic } from '@/services/apps/mapSupplierProductionOrder';
import { productionOrderService } from '@/services/apps/productionOrderService';
import type {
  DeliverySortOrder,
  ProductionOrderListResult,
  ProductionOrderTab,
  ProductionOrderTabStat,
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

export const PRODUCTION_ORDER_TABS: ProductionOrderTab[] = [
  'pending',
  'in_progress',
  'completed',
  'overdue',
];

export const EMPTY_PRODUCTION_ORDER_TAB_STATS: Record<ProductionOrderTab, ProductionOrderTabStat> =
  {
    pending: { orderCount: 0, pieceCount: 0 },
    in_progress: { orderCount: 0, pieceCount: 0 },
    completed: { orderCount: 0, pieceCount: 0 },
    overdue: { orderCount: 0, pieceCount: 0 },
  };

export type OrdersByTab = Record<ProductionOrderTab, ProductionOrderView[]>;

const emptyOrdersByTab = (): OrdersByTab => ({
  pending: [],
  in_progress: [],
  completed: [],
  overdue: [],
});

/**
 * 订单查询列表：
 * - 进入/刷新时并行拉取统计 + 四个 Tab 列表（均带对应 status）
 * - Tab 切换只读本地缓存，零请求
 */
export const useProductionOrders = ({
  keyword = '',
  productionOrderCode,
  tab,
  sort,
  enabled = true,
}: UseProductionOrdersParams) => {
  const [ordersByTab, setOrdersByTab] = useState<OrdersByTab>(emptyOrdersByTab);
  const [tabStats, setTabStats] = useState(EMPTY_PRODUCTION_ORDER_TAB_STATS);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [ready, setReady] = useState(false);

  const scopeKey = `${productionOrderCode ?? ''}\0${keyword}\0${sort}`;
  const requestIdRef = useRef(0);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        setOrdersByTab(emptyOrdersByTab());
        setTabStats(EMPTY_PRODUCTION_ORDER_TAB_STATS);
        setTotalOrderCount(0);
        setLoading(false);
        setReady(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      if (!options?.silent) {
        // 搜索条件变化（如清除选中生产单）时清空旧列表，让列表区回到 loading 态
        setLoading(true);
        setReady(false);
        setOrdersByTab(emptyOrdersByTab());
      }

      try {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
        const code = productionOrderCode?.trim() || undefined;
        const listParams = {
          keyword,
          ...(code ? { productionOrderCode: code } : {}),
          sort,
        };

        const [statistic, ...lists] = await Promise.all([
          productionOrderService.getStatistic({
            ...(code ? { productionOrderCode: code } : {}),
          }),
          ...PRODUCTION_ORDER_TABS.map((targetTab) =>
            productionOrderService.fetchOrderList({ ...listParams, tab: targetTab }),
          ),
        ]);

        if (requestId !== requestIdRef.current) return;

        const { tabStats: nextStats, totalOrderCount: nextTotal } =
          buildTabStatsFromStatistic(statistic);

        const next = emptyOrdersByTab();
        PRODUCTION_ORDER_TABS.forEach((targetTab, index) => {
          next[targetTab] = lists[index] ?? [];
        });

        setTabStats(nextStats);
        setTotalOrderCount(nextTotal);
        setOrdersByTab(next);
        setReady(true);
      } finally {
        if (requestId === requestIdRef.current && !options?.silent) {
          setLoading(false);
        }
      }
    },
    [enabled, keyword, productionOrderCode, sort],
  );

  useEffect(() => {
    void refresh();
  }, [refresh, scopeKey]);

  const data = useMemo<ProductionOrderListResult | null>(() => {
    if (!enabled) return null;
    return {
      supplierName: '',
      totalOrderCount,
      orders: ordersByTab[tab] ?? [],
      tabStats,
    };
  }, [enabled, ordersByTab, tab, tabStats, totalOrderCount]);

  return {
    data,
    ordersByTab,
    ready,
    loading: enabled && loading && !ready,
    refresh,
  };
};

export const useProductionOrderSearch = () => {
  const fetcher = useCallback(
    (keyword: string) => productionOrderService.searchOrders(keyword),
    [],
  );
  return useKeywordSearch<ProductionOrderView>(fetcher);
};
