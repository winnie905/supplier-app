import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import { HighlightedText } from '@/components/HighlightedText';
import { searchEmpty } from '@/components/images';
import { SearchCapsuleBar } from '@/components/SearchCapsuleBar';
import { ROUTES } from '@/constants/routes';
import { useProductionOrderSearch } from '@/hooks/apps/useProductionOrders';
import type { AppsScreenProps } from '@/navigation/types';
import { resolveTabForOrder } from '@/services/apps/mapSupplierProductionOrder';
import type { ProductionOrderView } from '@/types/apps';
import { getSafeAreaTopInset } from '@/utils/app';

type AppsSearchPageProps = AppsScreenProps<'AppsSearch'>;

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_COLOR = '#105FC8';

const getDisplayTitle = (item: ProductionOrderView, keyword: string): string => {
  const q = keyword.trim().toLowerCase();
  const cpo = item.representative.customerPurchaseOrder;
  if (!q) return cpo.productCode;
  const candidates = [cpo.productCode, cpo.customerPO, cpo.brand.name, item.productionOrderCode];
  return candidates.find((value) => value.toLowerCase().includes(q)) ?? cpo.productCode;
};

const SearchResultItem = ({
  item,
  keyword,
  isLast,
  onPress,
}: {
  item: ProductionOrderView;
  keyword: string;
  isLast: boolean;
  onPress: () => void;
}) => {
  const title = getDisplayTitle(item, keyword);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.resultItem, !isLast && styles.resultItemBorder]}
    >
      <View style={styles.resultTitleRow}>
        <Text style={styles.resultSearchGlyph}>⌕</Text>
        <View style={styles.resultTitleWrap}>
          <HighlightedText
            text={title}
            keyword={keyword}
            style={styles.resultTitle}
            highlightStyle={styles.resultTitleHighlight}
          />
        </View>
      </View>
      <View style={styles.resultMetaRow}>
        <Text style={styles.resultMeta} numberOfLines={1}>
          大货款号：{item.representative.customerPurchaseOrder.productCode}
        </Text>
        <Text style={[styles.resultMeta, styles.resultMetaRight]} numberOfLines={1}>
          品牌：{item.representative.customerPurchaseOrder.brand.name}
        </Text>
      </View>
    </Pressable>
  );
};

export const AppsSearchPage = ({ navigation, route }: AppsSearchPageProps) => {
  const insets = useSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets.top);
  const initialKeyword = route.params?.initialKeyword ?? '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const { results, loading, searched, search } = useProductionOrderSearch();

  useEffect(() => {
    const timer = setTimeout(() => {
      void search(keyword);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword, search]);

  const handleSearch = () => {
    // 无关键字：回到订单查询首页，展示当前供应商全部生产单
    if (!keyword.trim()) {
      navigation.reset({
        index: 1,
        routes: [
          { name: ROUTES.APPS.APPS_HOME },
          {
            name: ROUTES.APPS.PRODUCTION_ORDERS,
            params: {
              keyword: '',
              productionOrderCode: '',
            },
          },
        ],
      });
      return;
    }
    void search(keyword);
  };

  const handleClear = () => {
    setKeyword('');
  };

  const handleSelect = (item: ProductionOrderView) => {
    const fillKeyword = getDisplayTitle(item, keyword);
    // 回填生产单号到订单查询页：按状态选中对应 Tab，统计/列表按该单过滤
    navigation.reset({
      index: 1,
      routes: [
        { name: ROUTES.APPS.APPS_HOME },
        {
          name: ROUTES.APPS.PRODUCTION_ORDERS,
          params: {
            keyword: fillKeyword,
            productionOrderCode: item.productionOrderCode,
            tab: resolveTabForOrder(item),
          },
        },
      ],
    });
  };

  return (
    <View style={styles.root}>
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

        <SearchCapsuleBar
          autoFocus
          value={keyword}
          onChangeText={setKeyword}
          onClear={handleClear}
          onSearch={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#105FC8" style={styles.loader} />
      ) : searched && results.length === 0 ? (
        <View style={styles.empty}>
          <Image resizeMode="contain" source={searchEmpty} style={styles.emptyImage} />
          <Text style={styles.emptyTitle}>抱歉，没有找到相关数据~</Text>
          <Text style={styles.emptyHint}>换个词试试</Text>
        </View>
      ) : searched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.productionOrderCode}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <SearchResultItem
              item={item}
              keyword={keyword}
              isLast={index === results.length - 1}
              onPress={() => handleSelect(item)}
            />
          )}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 260,
    height: 200,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#525866',
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#525866',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDF3',
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#021626',
    fontWeight: '600',
  },
  resultTitleHighlight: {
    fontSize: 16,
    lineHeight: 22,
    color: HIGHLIGHT_COLOR,
    fontWeight: '600',
  },
  resultSearchGlyph: {
    fontSize: 16,
    color: '#A8BBD4',
    marginRight: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 26,
    gap: 12,
  },
  resultMeta: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#8A98AD',
  },
  resultMetaRight: {
    textAlign: 'right',
    flex: 1,
  },
});
