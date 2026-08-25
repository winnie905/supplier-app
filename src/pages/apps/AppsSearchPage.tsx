import { useEffect, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { useProductionOrderSearch } from '@/hooks/apps/useProductionOrders';
import type { AppsScreenProps } from '@/navigation/types';
import { SearchResultRow } from '@/sections/search/SearchResultRow';
import { SearchScreenShell } from '@/sections/search/SearchScreenShell';
import { resolveTabForOrder } from '@/services/apps/mapSupplierProductionOrder';
import type { ProductionOrderView } from '@/types/apps';
import {
  formatOrderSearchBarValue,
  getSearchResultDisplay,
} from '@/utils/search/searchResultDisplay';

type AppsSearchPageProps = AppsScreenProps<'AppsSearch'>;

const SEARCH_DEBOUNCE_MS = 300;

const toMatchFields = (item: ProductionOrderView) => {
  const cpo = item.representative.customerPurchaseOrder;
  return {
    productCode: cpo.productCode,
    customerPO: cpo.customerPO,
    brand: cpo.brand.name,
  };
};

export const AppsSearchPage = ({ navigation, route }: AppsSearchPageProps) => {
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

  const handleSelect = (item: ProductionOrderView) => {
    const code = item.productionOrderCode.trim();
    if (!code) return;

    // 搜索框展示大货款号/品牌；列表/统计按生产单号精确查询
    const fillKeyword = formatOrderSearchBarValue(toMatchFields(item));
    navigation.reset({
      index: 1,
      routes: [
        { name: ROUTES.APPS.APPS_HOME },
        {
          name: ROUTES.APPS.PRODUCTION_ORDERS,
          params: {
            keyword: fillKeyword,
            productionOrderCode: code,
            tab: resolveTabForOrder(item),
          },
        },
      ],
    });
  };

  return (
    <SearchScreenShell
      keyword={keyword}
      onChangeText={setKeyword}
      onClear={() => setKeyword('')}
      onSearch={handleSearch}
      onBack={() => navigation.goBack()}
      loading={loading}
      searched={searched}
      data={results}
      keyExtractor={(item, index) => item.productionOrderCode || String(index)}
      renderItem={(item, _index, isLast) => {
        const { title, secondLeft, thirdLine } = getSearchResultDisplay(
          toMatchFields(item),
          keyword,
        );
        return (
          <SearchResultRow
            title={title}
            keyword={keyword}
            secondLeft={secondLeft}
            thirdLine={thirdLine}
            isLast={isLast}
            onPress={() => handleSelect(item)}
          />
        );
      }}
    />
  );
};
