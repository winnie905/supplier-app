import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useId, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import BackIcon from '@/assets/icons/back.svg';
import { emptyPageImage, managementEmptyImage } from '@/components/images';
import { SearchEntryBar } from '@/components/SearchEntryBar';
import { useToast } from '@/components/toast/Toast';
import { ROUTES } from '@/constants/routes';
import { useProductionOrders } from '@/hooks/apps/useProductionOrders';
import type { AppsScreenProps } from '@/navigation/types';
import { OrderSearchScreenBackground } from '@/sections/apps/OrderSearchScreenBackground';
import { ProductionOrderCard } from '@/sections/apps/ProductionOrderCard';
import { ProductionOrderStatusTabs } from '@/sections/apps/ProductionOrderStatusTabs';
import { receivingService } from '@/services/receiving/receivingService';
import type { DeliverySortOrder, ProductionOrderTab, ProductionOrderView } from '@/types/apps';
import { getSafeAreaTopInset } from '@/utils/app';

type ProductionOrdersPageProps = AppsScreenProps<'ProductionOrders'>;

const emptyTabStats = {
  pending: { orderCount: 0, pieceCount: 0 },
  in_progress: { orderCount: 0, pieceCount: 0 },
  completed: { orderCount: 0, pieceCount: 0 },
  overdue: { orderCount: 0, pieceCount: 0 },
};

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
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
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
  const { showToast } = useToast();
  const gradientId = useId().replace(/:/g, '');

  const [keyword, setKeyword] = useState(route.params?.keyword ?? '');
  const [productionOrderCode, setProductionOrderCode] = useState(
    route.params?.productionOrderCode ?? '',
  );
  const [tab, setTab] = useState<ProductionOrderTab>(route.params?.tab ?? 'in_progress');
  const [sort] = useState<DeliverySortOrder>('asc');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [emptyPanelSize, setEmptyPanelSize] = useState({ width: 0, height: 0 });

  // 进入页即拉当前供应商全部订单；选中回填后按 productionOrderCode 拉统计/列表
  const { data, loading } = useProductionOrders({
    keyword,
    ...(productionOrderCode ? { productionOrderCode } : {}),
    tab,
    sort,
    enabled: true,
  });

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
    navigation.navigate(ROUTES.APPS.APPS_SEARCH, {
      ...(keyword ? { initialKeyword: keyword } : {}),
    });
  }, [keyword, navigation]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleColorPress = useCallback(
    async (productionColorId: string) => {
      try {
        await receivingService.selectProductionColor(productionColorId);
        showToast('已选中生产色，可前往收发管理操作', { duration: 2500 });
        navigation.getParent()?.navigate(ROUTES.TABS.LOGISTICS_TAB);
      } catch {
        showToast('选中生产色失败，请稍后重试', { duration: 3000 });
      }
    },
    [navigation, showToast],
  );

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

  const totalOrderCount = data?.totalOrderCount ?? 0;
  const orders = data?.orders ?? [];
  const tabStats = data?.tabStats ?? emptyTabStats;
  const showEmptyPanel = !loading && orders.length === 0 && totalOrderCount === 0;

  return (
    <View style={styles.page}>
      <OrderSearchScreenBackground />

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
            <ProductionOrderStatusTabs activeTab={tab} tabStats={tabStats} onChange={setTab} />
          </View>

          <View style={styles.ordersPanel} onLayout={onPanelLayout}>
            <OrdersPanelChrome
              width={panelSize.width}
              height={panelSize.height}
              gradientId={gradientId}
            />

            <FlatList
              data={orders}
              keyExtractor={(item) => item.productionOrderCode}
              contentContainerStyle={[
                styles.ordersListContent,
                { paddingBottom: Math.max(insets.bottom, 12) },
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.listEmpty}>
                    <ActivityIndicator color="#105FC8" />
                  </View>
                ) : (
                  <View style={styles.listEmpty}>
                    <Image
                      resizeMode="contain"
                      source={managementEmptyImage}
                      style={styles.emptyImage}
                    />
                    <Text style={styles.emptyText}>暂无数据</Text>
                  </View>
                )
              }
              renderItem={({ item }: { item: ProductionOrderView }) => (
                <ProductionOrderCard
                  order={item}
                  expanded={expandedIds.includes(item.productionOrderCode)}
                  onToggleExpand={() => toggleExpand(item.productionOrderCode)}
                  onColorPress={handleColorPress}
                />
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#DDEFFF',
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
  },
  listHeader: {
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
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
    paddingTop: 12,
    paddingHorizontal: 10,
    backgroundColor: '#EEF5FA',
    overflow: 'hidden',
  },
  ordersListContent: {
    gap: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    gap: 12,
  },
  emptyImage: {
    width: 170,
    height: 170,
  },
  emptyText: {
    fontSize: 14,
    color: '#525866',
    fontWeight: '600',
  },
});
