import { useCallback, useEffect, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { useProductionColorSearch } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { SearchResultRow } from '@/sections/search/SearchResultRow';
import { SearchScreenShell } from '@/sections/search/SearchScreenShell';
import { receivingService } from '@/services/receiving/receivingService';
import type { ProductionColorSummary } from '@/types/receiving';
import { getSearchResultDisplay } from '@/utils/search/searchResultDisplay';

type ReceivingSearchPageProps = LogisticsScreenProps<'ReceivingSearch'>;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * 跳转性能 vs 弹键盘：
 * 1. 首帧只画白底，让导航立刻出屏（避开首页重 JS 阻塞体感）
 * 2. 下一帧再挂搜索框，且首次即以 autoFocus 挂载（中途改 prop 无效）
 * 3. 再短延迟 focus() 兜底 Android
 * （deferredFocus 由 SearchScreenShell 实现，行为需保持）
 */
export const ReceivingSearchPage = ({ navigation, route }: ReceivingSearchPageProps) => {
  const initialKeyword = route.params?.initialKeyword ?? '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const [inputReady, setInputReady] = useState(false);
  const { results, loading, searched, search } = useProductionColorSearch();

  const handleReadyChange = useCallback((ready: boolean) => {
    setInputReady(ready);
  }, []);

  useEffect(() => {
    if (!inputReady) return;
    const timer = setTimeout(() => {
      void search(keyword);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputReady, keyword, search]);

  const handleSelect = async (item: ProductionColorSummary) => {
    await receivingService.selectProductionColorByOrderAndColor(
      item.productionOrderCode,
      item.color,
    );
    navigation.navigate(ROUTES.LOGISTICS.LOGISTICS_HOME);
  };

  return (
    <SearchScreenShell
      deferredFocus
      syncStatusBar
      keyword={keyword}
      onChangeText={setKeyword}
      onClear={() => setKeyword('')}
      onSearch={() => {
        void search(keyword);
      }}
      onBack={() => navigation.goBack()}
      onReadyChange={handleReadyChange}
      loading={loading}
      searched={searched}
      data={results}
      keyExtractor={(item) => item.id}
      renderItem={(item, _index, isLast) => {
        const { title, secondLeft, thirdLine, colorLabel } = getSearchResultDisplay(
          {
            productCode: item.productCode,
            customerPO: item.customerPO,
            brand: item.brand,
            color: item.color,
          },
          keyword,
        );
        return (
          <SearchResultRow
            title={title}
            keyword={keyword}
            secondLeft={secondLeft}
            thirdLine={thirdLine}
            {...(colorLabel != null ? { colorLabel } : {})}
            isLast={isLast}
            onPress={() => {
              void handleSelect(item);
            }}
          />
        );
      }}
    />
  );
};
