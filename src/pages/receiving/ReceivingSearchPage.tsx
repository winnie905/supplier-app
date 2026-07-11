import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import { searchEmpty } from '@/components/images';
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

const getDisplayTitle = (item: ProductionColorSummary, keyword: string): string => {
  const q = keyword.trim().toLowerCase();
  if (!q) {
    return item.bulkStyleNo;
  }

  const candidates = [item.bulkStyleNo, item.productionOrderNo, item.po, item.brand, item.color];

  return candidates.find((value) => value.toLowerCase().includes(q)) ?? item.bulkStyleNo;
};

const HighlightedText = ({
  text,
  keyword,
  style,
  highlightStyle,
}: {
  text: string;
  keyword: string;
  style: object;
  highlightStyle: object;
}) => {
  const parts = useMemo(() => {
    const q = keyword.trim();
    if (!q) {
      return [{ text, highlight: false }];
    }

    const lowerText = text.toLowerCase();
    const lowerQ = q.toLowerCase();
    const segments: { text: string; highlight: boolean }[] = [];
    let start = 0;
    let index = lowerText.indexOf(lowerQ, start);

    while (index !== -1) {
      if (index > start) {
        segments.push({ text: text.slice(start, index), highlight: false });
      }
      segments.push({ text: text.slice(index, index + q.length), highlight: true });
      start = index + q.length;
      index = lowerText.indexOf(lowerQ, start);
    }

    if (start < text.length) {
      segments.push({ text: text.slice(start), highlight: false });
    }

    return segments.length > 0 ? segments : [{ text, highlight: false }];
  }, [keyword, text]);

  return (
    <Text style={style}>
      {parts.map((part, partIndex) => (
        <Text key={`${part.text}-${partIndex}`} style={part.highlight ? highlightStyle : style}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
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
          大货款号：{item.bulkStyleNo}
        </Text>
        <Text style={[styles.resultMeta, styles.resultMetaRight]} numberOfLines={1}>
          颜色：{item.color}
        </Text>
      </View>
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

  const handleSelect = async (id: string) => {
    await receivingService.selectProductionColor(id);
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

            <View style={styles.capsule}>
              <Text style={styles.inputSearchGlyph}>⌕</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={autoFocusReady}
                onChangeText={setKeyword}
                onSubmitEditing={handleSearch}
                placeholder="搜索大货款号/客户PO/品牌"
                placeholderTextColor="#A8BBD4"
                returnKeyType="search"
                style={styles.input}
                value={keyword}
              />
              {keyword.length > 0 ? (
                <Pressable
                  accessibilityLabel="清除"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={handleClear}
                  style={styles.clearBtn}
                >
                  <View style={styles.clearIcon}>
                    <Text style={styles.clearGlyph}>×</Text>
                  </View>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={handleSearch} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>搜索</Text>
              </Pressable>
            </View>
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
                    void handleSelect(item.id);
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
  capsule: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    overflow: 'hidden',
    paddingLeft: 10,
  },
  inputSearchGlyph: {
    fontSize: 20,
    color: '#A8BBD4',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 15,
    color: '#061B37',
  },
  clearBtn: {
    paddingHorizontal: 6,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C8D4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearGlyph: {
    fontSize: 14,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultSearchGlyph: {
    fontSize: 16,
    color: '#A8BBD4',
    marginRight: 4,
  },
  searchBtn: {
    height: 30,
    paddingHorizontal: 8,
    backgroundColor: '#105FC8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 5,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 13,
    lineHeight: 18,
    color: '#8A98AD',
  },
  resultMetaRight: {
    textAlign: 'right',
    flex: 1,
  },
});
