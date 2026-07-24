import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
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
import { useProductionColorSearch } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { receivingService } from '@/services/receiving/receivingService';
import type { ProductionColorSummary } from '@/types/receiving';
import { getSafeAreaTopInset } from '@/utils/app';
import { navPerf, navPerfModuleLoad, navPerfScheduleProbes } from '@/utils/navPerf';

navPerfModuleLoad('ReceivingSearchPage');

type ReceivingSearchPageProps = LogisticsScreenProps<'ReceivingSearch'>;

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_COLOR = '#105FC8';

type SearchMatchField = 'productCode' | 'brand' | 'customerPO';

/** 按命中字段决定首行展示：大货款号 > 品牌 > 客户PO */
const resolveMatchField = (item: ProductionColorSummary, keyword: string): SearchMatchField => {
  const q = keyword.trim().toLowerCase();
  if (!q) return 'productCode';
  if (item.productCode.toLowerCase().includes(q)) return 'productCode';
  if (item.brand.toLowerCase().includes(q)) return 'brand';
  if (item.customerPO.toLowerCase().includes(q)) return 'customerPO';
  return 'productCode';
};

const getTitleByMatch = (item: ProductionColorSummary, match: SearchMatchField): string => {
  if (match === 'brand') return item.brand;
  if (match === 'customerPO') return item.customerPO;
  return item.productCode;
};

const SearchResultItem = ({
  item,
  keyword,
  isLast,
  onPress,
}: {
  item: ProductionColorSummary;
  keyword: string;
  isLast: boolean;
  onPress: () => void;
}) => {
  const match = resolveMatchField(item, keyword);
  const title = getTitleByMatch(item, match);

  // 情况1 大货款号：二行 客户PO+颜色，三行 品牌
  // 情况2 品牌：二行 大货款号+颜色，三行 客户PO
  // 情况3 客户PO：二行 大货款号+颜色，三行 品牌
  const secondLeft =
    match === 'productCode' ? `客户PO：${item.customerPO}` : `大货款号：${item.productCode}`;
  const thirdLine = match === 'brand' ? `客户PO：${item.customerPO}` : `品牌：${item.brand}`;

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
          {secondLeft}
        </Text>
        <Text style={[styles.resultMeta, styles.resultMetaRight]} numberOfLines={1}>
          颜色：{item.color}
        </Text>
      </View>
      <Text style={styles.resultMetaThird} numberOfLines={1}>
        {thirdLine}
      </Text>
    </Pressable>
  );
};

export const ReceivingSearchPage = ({ navigation, route }: ReceivingSearchPageProps) => {
  const firstRenderLogged = useRef(false);
  if (!firstRenderLogged.current) {
    firstRenderLogged.current = true;
    navPerf('search', 'first-render');
    navPerfScheduleProbes('search', 'first-render');
  }

  const insets = useSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets.top);
  const initialKeyword = route.params?.initialKeyword ?? '';
  const [keyword, setKeyword] = useState(initialKeyword);
  // 先挂白底壳，下一帧再挂搜索 UI，把首屏 commit 与重型子树拆开
  const [contentReady, setContentReady] = useState(false);
  const [autoFocusReady, setAutoFocusReady] = useState(false);
  const { results, loading, searched, search } = useProductionColorSearch();
  const laidOutRef = useRef(false);

  useEffect(() => {
    navPerf('search', 'mount-effect');
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setContentReady(true);
        navPerf('search', 'content-armed');
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    if (!contentReady) return;
    // 等 header commit 完成后再打点 / 聚焦，避免和重型子树抢同一帧
    const t = setTimeout(() => {
      setAutoFocusReady(true);
      navPerf('search', 'autofocus-armed');
    }, 0);
    return () => clearTimeout(t);
  }, [contentReady]);

  useFocusEffect(
    useCallback(() => {
      navPerf('search', 'focus-effect-start');
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('#FFFFFF');
      }
      navPerf('search', 'focus-effect-end');
      return () => {
        navPerf('search', 'blur');
      };
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void search(keyword);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [keyword, search]);

  const renderBodyEnded = useRef(false);
  if (!renderBodyEnded.current) {
    renderBodyEnded.current = true;
    navPerf('search', 'render-body-end');
  }

  const handleSearch = () => {
    void search(keyword);
  };

  const handleClear = () => {
    setKeyword('');
  };

  const handleSelect = async (item: ProductionColorSummary) => {
    await receivingService.selectProductionColorByOrderAndColor(
      item.productionOrderCode,
      item.color,
    );
    navigation.navigate(ROUTES.LOGISTICS.LOGISTICS_HOME);
  };

  return (
    <View
      style={styles.root}
      onLayout={() => {
        if (laidOutRef.current) return;
        laidOutRef.current = true;
        navPerf('search', 'root-layout');
      }}
    >
      {contentReady ? (
        <>
          <View
            style={[styles.header, { paddingTop: topInset + 8 }]}
            onLayout={() => navPerf('search', 'header-layout')}
          >
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
              autoFocus={autoFocusReady}
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
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => (
                <SearchResultItem
                  item={item}
                  keyword={keyword}
                  isLast={index === results.length - 1}
                  onPress={() => {
                    void handleSelect(item);
                  }}
                />
              )}
            />
          ) : null}
        </>
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
  resultSearchGlyph: {
    fontSize: 16,
    color: '#A8BBD4',
    marginRight: 4,
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
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 26,
    gap: 12,
  },
  resultMeta: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
  resultMetaRight: {
    textAlign: 'right',
    flex: 1,
  },
  resultMetaThird: {
    marginTop: 4,
    marginLeft: 26,
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
});
