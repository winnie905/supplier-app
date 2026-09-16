import type { DocumentNode } from 'graphql';

import { apolloClient } from '@/graphql/client';
import {
  CONFIRM_ARRIVE_MATERIAL,
  CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD,
  PRODUCTION_ORDER_SUPPLIER_DETAIL,
  PRODUCTION_ORDER_SUPPLIER_SEARCH,
  PRODUCTION_ORDER_SUPPLIER_STATISTIC,
} from '@/graphql/operations/productionOrder/operations';
import {
  buildLastDeliveryDateSortNode,
  buildTabStatsFromStatistic,
  mapDetailToProductionOrderVO,
  mapSearchRecordsToOrders,
  mapSearchRecordToOrderView,
  tabToSearchFilter,
} from '@/services/apps/mapSupplierProductionOrder';
import type {
  DeliverySortOrder,
  ProductionOrderListResult,
  ProductionOrderTab,
  ProductionOrderView,
} from '@/types/apps';
import type { ProductionOrderVO } from '@/types/productionOrder';
import type {
  ConfirmArriveMaterialInput,
  CreateExceptionRecordInput,
  ProductionOrderSupplierCount,
  ProductionOrderSupplierDetail,
  ProductionOrderSupplierSearchInput,
  ProductionOrderSupplierSearchResult,
  SupplierExceptionRecord,
} from '@/types/supplierProductionOrder';

const DEFAULT_PAGE_SIZE = 50;
/** 订单查询列表默认分页 */
export const PRODUCTION_ORDER_LIST_PAGE_SIZE = 20;

const EMPTY_SEARCH_RESULT: ProductionOrderSupplierSearchResult = {
  total: 0,
  size: DEFAULT_PAGE_SIZE,
  pages: 0,
  page: 1,
  records: [],
};

const query = async <TData>(
  document: DocumentNode,
  variables: Record<string, unknown>,
): Promise<TData> => {
  const { data } = await apolloClient.query<TData>({
    query: document,
    variables,
    // 生产单状态随到料/异常上报变化，缓存会导致页面读到旧状态
    fetchPolicy: 'network-only',
  });

  if (!data) {
    throw new Error('生产单接口返回为空');
  }
  return data;
};

const searchProductionOrders = async (
  input: ProductionOrderSupplierSearchInput,
  page = 1,
  size = DEFAULT_PAGE_SIZE,
): Promise<ProductionOrderSupplierSearchResult> => {
  const data = await query<{
    productionOrderSupplierSearch: ProductionOrderSupplierSearchResult | null;
  }>(PRODUCTION_ORDER_SUPPLIER_SEARCH, { input, page, size });

  return data.productionOrderSupplierSearch ?? EMPTY_SEARCH_RESULT;
};

/** 供应商生产单服务，直连 apex-bff GraphQL。 */
export const productionOrderService = {
  /**
   * 供应商生产单统计。
   * - 首页进入：不传 productionOrderCode → 当前供应商全部
   * - 搜索选中回填：传 productionOrderCode → 该生产单统计
   * 不按 Tab status 过滤，以便一次拿到各 Tab 数量。
   */
  async getStatistic(params?: {
    productionOrderCode?: string;
  }): Promise<ProductionOrderSupplierCount> {
    const data = await query<{
      productionOrderSupplierStatistic: ProductionOrderSupplierCount;
    }>(PRODUCTION_ORDER_SUPPLIER_STATISTIC, {
      input: {
        ...(params?.productionOrderCode ? { productionOrderCode: params.productionOrderCode } : {}),
      },
    });
    return data.productionOrderSupplierStatistic;
  },

  /** 关键字搜索生产单列表（搜索页，仅文案匹配，无需补拉样衣图） */
  async searchOrders(keyword: string): Promise<ProductionOrderView[]> {
    const q = keyword.trim();
    if (!q) return [];

    const result = await searchProductionOrders({ keyword: q });
    return result.records.map((record) => mapSearchRecordToOrderView(record));
  },

  /** 关键字搜索原始 records（收发按色展开用） */
  async searchOrderRecords(keyword: string): Promise<ProductionOrderSupplierSearchResult> {
    const q = keyword.trim();
    if (!q) return EMPTY_SEARCH_RESULT;

    return searchProductionOrders({ keyword: q });
  },

  /**
   * 订单查询：仅拉当前 Tab 列表（不含统计，便于 Tab 切换少打接口）。
   * 排序走 input.sortNode（erp-web getSortParams 结构），分页默认 20 条。
   */
  async fetchOrderList(params: {
    keyword?: string;
    productionOrderCode?: string;
    tab: ProductionOrderTab;
    sort: DeliverySortOrder;
    page?: number;
    size?: number;
  }): Promise<{
    orders: ProductionOrderView[];
    page: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
    const productionOrderCode = params.productionOrderCode?.trim() || undefined;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
    const keyword = params.keyword?.trim() || undefined;
    const tabFilter = tabToSearchFilter(params.tab);
    const page = params.page ?? 1;
    const size = params.size ?? PRODUCTION_ORDER_LIST_PAGE_SIZE;

    const searchInput: ProductionOrderSupplierSearchInput = {
      ...(productionOrderCode ? { productionOrderCode } : keyword ? { keyword } : {}),
      ...tabFilter,
      sortNode: buildLastDeliveryDateSortNode(params.sort),
    };

    const searchResult = await searchProductionOrders(searchInput, page, size);
    return {
      orders: mapSearchRecordsToOrders(searchResult.records),
      // 用本次请求的页码做游标，避免接口把 page 固定成 1 导致无法翻页
      page,
    };
  },

  /**
   * 订单查询首页列表 + Tab 统计。
   * 列表按当前 Tab 传 status / isOverTime；有生产单号时一并带上。
   */
  async listOrders(params: {
    keyword?: string;
    productionOrderCode?: string;
    tab: ProductionOrderTab;
    sort: DeliverySortOrder;
  }): Promise<ProductionOrderListResult> {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
    const productionOrderCode = params.productionOrderCode?.trim() || undefined;

    const [list, statistic] = await Promise.all([
      this.fetchOrderList(params),
      this.getStatistic({
        ...(productionOrderCode ? { productionOrderCode } : {}),
      }),
    ]);

    const { tabStats, totalOrderCount } = buildTabStatsFromStatistic(statistic);

    return {
      supplierName: '',
      totalOrderCount,
      orders: list.orders,
      tabStats,
    };
  },

  async getDetail(params: {
    productionOrderCode: string;
    color: string;
  }): Promise<ProductionOrderSupplierDetail> {
    const data = await query<{
      productionOrderSupplierDetail: ProductionOrderSupplierDetail | null;
    }>(PRODUCTION_ORDER_SUPPLIER_DETAIL, {
      productionOrderCode: params.productionOrderCode,
      color: params.color,
    });

    const detail = data.productionOrderSupplierDetail;
    if (!detail) {
      throw new Error('生产单详情不存在');
    }
    return detail;
  },

  async getDetailAsVO(params: {
    productionOrderCode: string;
    color: string;
  }): Promise<ProductionOrderVO> {
    const detail = await this.getDetail(params);
    return mapDetailToProductionOrderVO(detail);
  },

  /** 确认到料。mutation 只返回 Boolean，成功后回拉一次详情供页面刷新 */
  async confirmArriveMaterial(
    detail: Pick<ProductionOrderSupplierDetail, 'id' | 'productionOrderCode' | 'color'>,
    input: ConfirmArriveMaterialInput,
  ): Promise<ProductionOrderSupplierDetail> {
    const { data } = await apolloClient.mutate<{ confirmArriveMaterial: boolean }>({
      mutation: CONFIRM_ARRIVE_MATERIAL,
      variables: { productionId: detail.id, input },
    });

    if (data?.confirmArriveMaterial !== true) {
      throw new Error('确认到料失败');
    }

    return this.getDetail({
      productionOrderCode: detail.productionOrderCode,
      color: detail.color,
    });
  },

  async createExceptionRecord(input: CreateExceptionRecordInput): Promise<SupplierExceptionRecord> {
    const { data } = await apolloClient.mutate<{
      createProductionOrderExceptionRecord: SupplierExceptionRecord;
    }>({
      mutation: CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD,
      variables: { input },
    });

    const record = data?.createProductionOrderExceptionRecord;
    if (!record) {
      throw new Error('异常上报失败');
    }
    return record;
  },
};
