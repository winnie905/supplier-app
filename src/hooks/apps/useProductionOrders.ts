import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useKeywordSearch } from '@/hooks/useKeywordSearch';
import { buildTabStatsFromStatistic } from '@/services/apps/mapSupplierProductionOrder';
import {
  PRODUCTION_ORDER_LIST_PAGE_SIZE,
  productionOrderService,
} from '@/services/apps/productionOrderService';
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

interface TabPageMeta {
  page: number;
  hasMore: boolean;
}

const emptyOrdersByTab = (): OrdersByTab => ({
  pending: [],
  in_progress: [],
  completed: [],
  overdue: [],
});

const emptyPageMetaByTab = (): Record<ProductionOrderTab, TabPageMeta> => ({
  pending: { page: 0, hasMore: false },
  in_progress: { page: 0, hasMore: false },
  completed: { page: 0, hasMore: false },
  overdue: { page: 0, hasMore: false },
});

/** 本页未满则没有下一页。不用 pages（接口常把 pages 固定成 1，会误判没有更多） */
const hasMoreFromResult = (orders: readonly unknown[]): boolean =>
  orders.length >= PRODUCTION_ORDER_LIST_PAGE_SIZE;

const appendUniqueOrders = (
  prev: ProductionOrderView[],
  next: ProductionOrderView[],
): ProductionOrderView[] => {
  const seen = new Set(prev.map((order) => order.productionOrderCode));
  const appended = next.filter((order) => {
    if (!order.productionOrderCode || seen.has(order.productionOrderCode)) return false;
    seen.add(order.productionOrderCode);
    return true;
  });
  return appended.length === 0 ? prev : [...prev, ...appended];
};

/**
 * 订单查询列表：
 * - 进入/刷新时并行拉取统计 + 四个 Tab 第一页（每页 20 条，sortNode 服务端排序）
 * - Tab 切换只读本地缓存，零请求
 * - 当前 Tab 滚到底加载下一页
 */
export const useProductionOrders = ({
  keyword = '',
  productionOrderCode,
  tab,
  sort,
  enabled = true,
}: UseProductionOrdersParams) => {
  const [ordersByTab, setOrdersByTab] = useState<OrdersByTab>(emptyOrdersByTab);
  const [pageMetaByTab, setPageMetaByTab] =
    useState<Record<ProductionOrderTab, TabPageMeta>>(emptyPageMetaByTab);
  const [tabStats, setTabStats] = useState(EMPTY_PRODUCTION_ORDER_TAB_STATS);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ready, setReady] = useState(false);

  const filterKey = `${productionOrderCode ?? ''}\0${keyword}`;
  const requestIdRef = useRef(0);
  const readyRef = useRef(false);
  const fetchingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const filterKeyRef = useRef(filterKey);
  const pageMetaRef = useRef(pageMetaByTab);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  pageMetaRef.current = pageMetaByTab;

  const fetchTabPage = useCallback(
    (targetTab: ProductionOrderTab, page: number) => {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
      const code = productionOrderCode?.trim() || undefined;
      return productionOrderService.fetchOrderList({
        keyword,
        ...(code ? { productionOrderCode: code } : {}),
        tab: targetTab,
        sort,
        page,
      });
    },
    [keyword, productionOrderCode, sort],
  );

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        setOrdersByTab(emptyOrdersByTab());
        setPageMetaByTab(emptyPageMetaByTab());
        setTabStats(EMPTY_PRODUCTION_ORDER_TAB_STATS);
        setTotalOrderCount(0);
        setLoading(false);
        setIsFetching(false);
        fetchingRef.current = false;
        setLoadingMore(false);
        loadingMoreRef.current = false;
        setReady(false);
        readyRef.current = false;
        return;
      }

      const requestId = ++requestIdRef.current;
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setReady(false);
        readyRef.current = false;
        setOrdersByTab(emptyOrdersByTab());
        setPageMetaByTab(emptyPageMetaByTab());
      }
      fetchingRef.current = true;
      setIsFetching(true);
      setLoadingMore(false);
      loadingMoreRef.current = false;

      try {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
        const code = productionOrderCode?.trim() || undefined;
        const [statistic, ...lists] = await Promise.all([
          productionOrderService.getStatistic({
            ...(code ? { productionOrderCode: code } : {}),
          }),
          ...PRODUCTION_ORDER_TABS.map((targetTab) => fetchTabPage(targetTab, 1)),
        ]);

        if (requestId !== requestIdRef.current) return;

        const { tabStats: nextStats, totalOrderCount: nextTotal } =
          buildTabStatsFromStatistic(statistic);

        const next = emptyOrdersByTab();
        const nextMeta = emptyPageMetaByTab();
        PRODUCTION_ORDER_TABS.forEach((targetTab, index) => {
          const list = lists[index];
          next[targetTab] = list?.orders ?? [];
          nextMeta[targetTab] = {
            page: list?.page ?? 1,
            hasMore: list ? hasMoreFromResult(list.orders) : false,
          };
        });

        setTabStats(nextStats);
        setTotalOrderCount(nextTotal);
        setOrdersByTab(next);
        setPageMetaByTab(nextMeta);
        setReady(true);
        readyRef.current = true;
      } finally {
        if (requestId === requestIdRef.current) {
          fetchingRef.current = false;
          setIsFetching(false);
          if (!silent) {
            setLoading(false);
          }
        }
      }
    },
    [enabled, fetchTabPage, productionOrderCode],
  );

  useEffect(() => {
    const filterChanged = filterKeyRef.current !== filterKey;
    filterKeyRef.current = filterKey;
    const silent = !filterChanged && readyRef.current;
    void refresh({ silent });
  }, [refresh, filterKey]);

  const loadMore = useCallback(async () => {
    if (!enabled || !readyRef.current || fetchingRef.current || loadingMoreRef.current) return;

    const currentTab = tabRef.current;
    const meta = pageMetaRef.current[currentTab];
    if (!meta.hasMore) return;

    const requestId = requestIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const result = await fetchTabPage(currentTab, meta.page + 1);
      if (requestId !== requestIdRef.current) return;

      setOrdersByTab((prev) => ({
        ...prev,
        [currentTab]: appendUniqueOrders(prev[currentTab], result.orders),
      }));
      setPageMetaByTab((prev) => ({
        ...prev,
        [currentTab]: {
          page: result.page,
          hasMore: hasMoreFromResult(result.orders),
        },
      }));
    } catch {
      // 下一页失败时保持 hasMore，滚到底可重试
    } finally {
      loadingMoreRef.current = false;
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [enabled, fetchTabPage]);

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
    isFetching,
    loadingMore,
    hasMore: pageMetaByTab[tab]?.hasMore ?? false,
    loadMore,
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
