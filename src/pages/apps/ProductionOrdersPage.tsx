import { useFocusEffect } from '@react-navigation/native';
import { designTokens, useToast } from 'design-system-native';
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import BackIcon from '@/assets/icons/back.svg';
import { emptyPageImage } from '@/components/images';
import { PullToRefreshContainer, WorkbenchRefreshIndicator } from '@/components/pullToRefresh';
import { SearchEntryBar } from '@/components/SearchEntryBar';
import { ROUTES } from '@/constants/routes';
import { useProductCategories } from '@/hooks/apps/useProductCategories';
import {
  EMPTY_PRODUCTION_ORDER_TAB_STATS,
  PRODUCTION_ORDER_TABS,
  useProductionOrders,
} from '@/hooks/apps/useProductionOrders';
import type { AppsScreenProps } from '@/navigation/types';
import { DeliverySortMenu } from '@/sections/apps/DeliverySortMenu';
import { OrderSearchScreenBackground } from '@/sections/apps/OrderSearchScreenBackground';
import { ProductionOrderCard } from '@/sections/apps/ProductionOrderCard';
import { ProductionOrderStatusTabs } from '@/sections/apps/ProductionOrderStatusTabs';
import { receivingService } from '@/services/receiving/receivingService';
import type { DeliverySortOrder, ProductionOrderTab, ProductionOrderView } from '@/types/apps';
import { getSafeAreaTopInset } from '@/utils/app';

type ProductionOrdersPageProps = AppsScreenProps<'ProductionOrders'>;

const keyExtractor = (item: ProductionOrderView, index: number) =>
  item.productionOrderCode || String(index);

/** 距底部小于该距离时加载下一页（不依赖 FlatList onEndReached，嵌套手势下经常不触发） */
const LOAD_MORE_DISTANCE_PX = 160;

const isNearListEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): boolean => {
  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
  if (contentSize.height <= 0 || layoutMeasurement.height <= 0) return false;
  return contentSize.height - layoutMeasurement.height - contentOffset.y <= LOAD_MORE_DISTANCE_PX;
};

interface OrderTabPanelProps {
  tabKey: ProductionOrderTab;
  active: boolean;
  data: ProductionOrderView[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  expandedIds: string[];
  contentContainerStyle: object;
  getCategoryLabel: (categoryKey?: string) => string;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onEndReached?: () => void;
  onToggleExpand: (id: string) => void;
  onColorPress: (ref: { productionOrderCode: string; color: string }) => void;
}

const OrderTabPanel = memo(function OrderTabPanel({
  tabKey,
  active,
  data,
  loading,
  loadingMore,
  hasMore,
  expandedIds,
  contentContainerStyle,
  getCategoryLabel,
  onScroll,
  onEndReached,
  onToggleExpand,
  onColorPress,
}: OrderTabPanelProps) {
  const showOverdueBadge = tabKey === 'overdue';

  const renderItem = useCallback(
    ({ item }: { item: ProductionOrderView }) => (
      <ProductionOrderCard
        order={item}
        showOverdueBadge={showOverdueBadge}
        categoryLabel={getCategoryLabel(item.representative.templateDesign.category)}
        expanded={expandedIds.includes(item.productionOrderCode)}
        onToggleExpand={() => onToggleExpand(item.productionOrderCode)}
        onColorPress={onColorPress}
      />
    ),
    [expandedIds, getCategoryLabel, onColorPress, onToggleExpand, showOverdueBadge],
  );

  const empty = useMemo(
    () =>
      loading ? (
        <View style={styles.listEmpty}>
          <WorkbenchRefreshIndicator label="加载中..." />
        </View>
      ) : (
        <View style={styles.listEmpty}>
          <Image resizeMode="contain" source={emptyPageImage} style={styles.emptyImage} />
          <Text style={styles.emptyText}>暂无数据</Text>
        </View>
      ),
    [loading],
  );

  const footer = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreFooter}>
          <WorkbenchRefreshIndicator label="加载中..." />
        </View>
      );
    }
    if (hasMore && data.length > 0) {
      return (
        <View style={styles.loadMoreFooter}>
          <Text style={styles.loadMoreHint}>上划加载更多数据</Text>
        </View>
      );
    }
    return null;
  }, [data.length, hasMore, loadingMore]);

  const maybeLoadMore = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (active && data.length > 0 && isNearListEnd(event)) {
        onEndReached?.();
      }
    },
    [active, data.length, onEndReached],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll(event);
      maybeLoadMore(event);
    },
    [maybeLoadMore, onScroll],
  );

  return (
    <View
      pointerEvents={active ? 'auto' : 'none'}
      style={[styles.listLayer, active ? styles.listLayerActive : styles.listLayerHidden]}
    >
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={
          data.length === 0
            ? [contentContainerStyle, styles.listContentGrow]
            : contentContainerStyle
        }
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={maybeLoadMore}
        onEndReached={active ? onEndReached : undefined}
        onEndReachedThreshold={0.4}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        renderItem={renderItem}
      />
    </View>
  );
});

const OrdersPanelChrome = ({
  width,
  height,
  gradientId,
  topOnly = false,
}: {
  width: number;
  height: number;
  gradientId: string;
  /** 仅上方圆角 18（空态面板用） */
  topOnly?: boolean;
}) => {
  if (width <= 0 || height <= 0) return null;

  const strokeId = `${gradientId}-stroke`;
  const r = 18;
  const w = Math.max(width - 1, 0);
  const h = Math.max(height - 1, 0);
  const topOnlyPath = `M0.5 ${height - 0.5} L0.5 ${r + 0.5} Q0.5 0.5 ${r + 0.5} 0.5 L${width - r - 0.5} 0.5 Q${width - 0.5} 0.5 ${width - 0.5} ${r + 0.5} L${width - 0.5} ${height - 0.5} Z`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {/* border-image: linear-gradient(180deg, #ffffff 0%, #ffffff00 100%) */}
        <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {topOnly ? (
        <Path d={topOnlyPath} fill="transparent" stroke={`url(#${strokeId})`} strokeWidth={1} />
      ) : (
        <Rect
          x={0.5}
          y={0.5}
          width={w}
          height={h}
          rx={18}
          ry={18}
          fill="transparent"
          stroke={`url(#${strokeId})`}
          strokeWidth={1}
        />
      )}
    </Svg>
  );
};

export const ProductionOrdersPage = ({ navigation, route }: ProductionOrdersPageProps) => {
  const insets = useSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets.top);
  const toast = useToast();
  const gradientId = useId().replace(/:/g, '');

  const [keyword, setKeyword] = useState(route.params?.keyword ?? '');
  const [productionOrderCode, setProductionOrderCode] = useState(
    route.params?.productionOrderCode ?? '',
  );
  const [tab, setTab] = useState<ProductionOrderTab>(route.params?.tab ?? 'in_progress');
  const [sort, setSort] = useState<DeliverySortOrder>('asc');
  const [isSortPending, setIsSortPending] = useState(false);
  const sawSortFetchRef = useRef(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [emptyPanelSize, setEmptyPanelSize] = useState({ width: 0, height: 0 });
  const [listAtTopByTab, setListAtTopByTab] = useState<Record<ProductionOrderTab, boolean>>({
    pending: true,
    in_progress: true,
    completed: true,
    overdue: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 进入页并行拉统计 + 四 Tab 列表；切换 Tab 只切本地缓存
  const { data, ordersByTab, loading, isFetching, loadingMore, hasMore, loadMore, refresh } =
    useProductionOrders({
      keyword,
      ...(productionOrderCode ? { productionOrderCode } : {}),
      tab,
      sort,
      enabled: true,
    });
  const handleSortChange = useCallback((next: DeliverySortOrder) => {
    sawSortFetchRef.current = false;
    setIsSortPending(true);
    setSort(next);
  }, []);

  useEffect(() => {
    if (!isSortPending) {
      sawSortFetchRef.current = false;
      return;
    }
    if (isFetching) {
      sawSortFetchRef.current = true;
      return;
    }
    if (sawSortFetchRef.current) {
      setIsSortPending(false);
    }
  }, [isFetching, isSortPending]);

  const handleEndReached = useCallback(() => {
    void loadMore();
  }, [loadMore]);
  const { getCategoryLabel } = useProductCategories();

  useFocusEffect(
    useCallback(() => {
      const nextKeyword = route.params?.keyword;
      const nextCode = route.params?.productionOrderCode;
      const nextTab = route.params?.tab;
      if (typeof nextKeyword === 'string') {
        setKeyword(nextKeyword);
      }
      if (typeof nextCode === 'string') {
        setProductionOrderCode(nextCode);
      }
      if (nextTab) {
        setTab(nextTab);
      }
    }, [route.params?.keyword, route.params?.productionOrderCode, route.params?.tab]),
  );

  const goSearch = useCallback(() => {
    // 已选中回填（大货款号/颜色/品牌）时不带入搜索页，与收发管理一致
    navigation.navigate(ROUTES.APPS.APPS_SEARCH, {
      ...(productionOrderCode || !keyword.trim() ? {} : { initialKeyword: keyword }),
    });
  }, [keyword, navigation, productionOrderCode]);

  /** 清除搜索条件：回到全部生产单 */
  const clearSearch = useCallback(() => {
    setKeyword('');
    setProductionOrderCode('');
    navigation.setParams({ keyword: '', productionOrderCode: '' });
  }, [navigation]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleColorPress = useCallback(
    async (ref: { productionOrderCode: string; color: string }) => {
      try {
        await receivingService.selectProductionColorByOrderAndColor(
          ref.productionOrderCode,
          ref.color,
        );
        navigation.getParent()?.navigate(ROUTES.TABS.LOGISTICS_TAB, {
          screen: ROUTES.LOGISTICS.LOGISTICS_HOME,
        });
      } catch {
        toast.show({ title: '选中生产色失败，请稍后重试', duration: 3000 });
      }
    },
    [navigation, toast],
  );

  /**
   * 下拉刷新（页面顶部「下拉刷新 / 正在刷新...」，与收发首页同款）：
   * - 有选中生产单号：重拉该单列表 + 统计
   * - 无选中：重拉最近生产单列表 + 统计
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh({ silent: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const onPanelLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPanelSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const onEmptyPanelLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setEmptyPanelSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const listContentStyle = useMemo(
    () => [styles.ordersListContent, { paddingBottom: Math.max(insets.bottom, 12) }],
    [insets.bottom],
  );

  const scrollHandlers = useMemo(() => {
    const createHandler =
      (tabKey: ProductionOrderTab) => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const atTop = event.nativeEvent.contentOffset.y <= 0.5;
        setListAtTopByTab((prev) => (prev[tabKey] === atTop ? prev : { ...prev, [tabKey]: atTop }));
      };
    return {
      pending: createHandler('pending'),
      in_progress: createHandler('in_progress'),
      completed: createHandler('completed'),
      overdue: createHandler('overdue'),
    } satisfies Record<
      ProductionOrderTab,
      (event: NativeSyntheticEvent<NativeScrollEvent>) => void
    >;
  }, []);

  const totalOrderCount = data?.totalOrderCount ?? 0;
  const tabStats = data?.tabStats ?? EMPTY_PRODUCTION_ORDER_TAB_STATS;
  const showEmptyPanel = !loading && totalOrderCount === 0;
  const pullEnabled = showEmptyPanel || listAtTopByTab[tab] || isRefreshing;

  return (
    <View style={styles.page}>
      <OrderSearchScreenBackground />

      <PullToRefreshContainer
        enabled={pullEnabled}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        topInset={topInset}
      >
        <View style={styles.body}>
          <View style={[styles.header, { paddingTop: topInset + 8 }]}>
            <Pressable
              accessibilityLabel="返回"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <BackIcon color="#061B37" height={22} width={22} />
            </Pressable>
            <SearchEntryBar
              showScan={false}
              style={styles.searchBar}
              value={keyword}
              onClear={clearSearch}
              onSearchPress={goSearch}
            />
          </View>

          {showEmptyPanel ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.totalCount}>共 0 个订单</Text>
              <View
                style={[styles.emptyPanel, { paddingBottom: 24 + insets.bottom }]}
                onLayout={onEmptyPanelLayout}
              >
                <OrdersPanelChrome
                  topOnly
                  width={emptyPanelSize.width}
                  height={emptyPanelSize.height}
                  gradientId={`${gradientId}-empty`}
                />
                <Image resizeMode="contain" source={emptyPageImage} style={styles.emptyImage} />
                <Text style={styles.emptyText}>暂无数据</Text>
              </View>
            </View>
          ) : (
            <View style={styles.listWrap}>
              <View style={styles.listHeader}>
                <Text style={styles.totalCountInline}>共 {totalOrderCount} 个订单</Text>
                <View style={styles.statusBlock}>
                  <ProductionOrderStatusTabs
                    activeTab={tab}
                    tabStats={tabStats}
                    onChange={setTab}
                  />
                  <DeliverySortMenu value={sort} onChange={handleSortChange} />
                </View>
              </View>

              <View style={styles.ordersPanel} onLayout={onPanelLayout}>
                <OrdersPanelChrome
                  width={panelSize.width}
                  height={panelSize.height}
                  gradientId={gradientId}
                />

                <View style={styles.listStack}>
                  {PRODUCTION_ORDER_TABS.map((tabKey) => (
                    <OrderTabPanel
                      key={tabKey}
                      tabKey={tabKey}
                      active={tab === tabKey}
                      data={ordersByTab[tabKey]}
                      loading={loading}
                      loadingMore={tab === tabKey && loadingMore}
                      hasMore={tab === tabKey && hasMore}
                      expandedIds={expandedIds}
                      contentContainerStyle={listContentStyle}
                      getCategoryLabel={getCategoryLabel}
                      onScroll={scrollHandlers[tabKey]}
                      onEndReached={handleEndReached}
                      onToggleExpand={toggleExpand}
                      onColorPress={handleColorPress}
                    />
                  ))}
                </View>
                {isSortPending ? (
                  <View pointerEvents="auto" style={styles.sortLoadingOverlay}>
                    <WorkbenchRefreshIndicator />
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </PullToRefreshContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#DDEFFF',
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    marginHorizontal: 0,
  },
  emptyWrap: {
    flex: 1,
  },
  totalCount: {
    marginHorizontal: 16,
    marginBottom: 10,
    fontSize: 16,
    color: '#6B7A90',
  },
  emptyPanel: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 42,
    paddingHorizontal: 10,
    gap: 12,
    backgroundColor: '#EEF5FA',
    alignItems: 'center',
    overflow: 'hidden',
  },
  listWrap: {
    flex: 1,
    overflow: 'visible',
  },
  listHeader: {
    gap: 10,
    paddingBottom: 0,
    paddingHorizontal: 12,
  },
  statusBlock: {
    alignSelf: 'center',
  },
  totalCountInline: {
    paddingHorizontal: 4,
    fontSize: 16,
    color: '#061B37',
    fontWeight: '600',
  },
  ordersPanel: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 8,
    paddingHorizontal: 10,
    backgroundColor: '#EEF5FA',
    overflow: 'hidden',
  },
  listStack: {
    flex: 1,
  },
  listLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  listLayerActive: {
    opacity: 1,
    zIndex: 1,
  },
  listLayerHidden: {
    opacity: 0,
    zIndex: 0,
  },
  list: {
    flex: 1,
  },
  ordersListContent: {
    gap: 12,
    paddingBottom: 24,
  },
  listContentGrow: {
    flexGrow: 1,
  },
  listEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    gap: 12,
  },
  loadMoreFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreHint: {
    fontSize: 13,
    color: designTokens.colors.gray[500],
  },
  sortLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 245, 250, 0.72)',
  },
  emptyImage: {
    width: 170,
    height: 170,
  },
  emptyText: {
    fontSize: 14,
    color: designTokens.colors.gray[500],
    fontWeight: '600',
  },
});
