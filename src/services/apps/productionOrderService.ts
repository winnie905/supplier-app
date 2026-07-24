import {
  CONFIRM_ARRIVE_MATERIAL,
  CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD,
  PRODUCTION_ORDER_SUPPLIER_DETAIL,
  PRODUCTION_ORDER_SUPPLIER_SEARCH,
  PRODUCTION_ORDER_SUPPLIER_STATISTIC,
} from '@/graphql/operations/productionOrder/operations';
import type { tabToSupplierStatus } from '@/services/apps/mapSupplierProductionOrder';
import {
  buildListResultFromSearchAndStatistic,
  mapDetailToProductionOrderVO,
  mapSearchRecordToOrderView,
} from '@/services/apps/mapSupplierProductionOrder';
import { executeMockProductionOrderGraphql } from '@/services/apps/mockProductionOrderGraphql';
import {
  getMockDetailById,
  MOCK_SUPPLIER_PRODUCTION_COLOR_LEGACY_IDS,
} from '@/services/apps/mockSupplierProductionOrderApi';
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
  ProductionOrderSupplierSearchResult,
  SupplierExceptionRecord,
} from '@/types/supplierProductionOrder';

/**
 * 供应商生产单服务。
 * 当前走本地 mock GraphQL；BFF 就绪后将 executeMockProductionOrderGraphql 替换为 apolloClient 即可。
 */
export const productionOrderService = {
  /** @deprecated 收发已改用生产色数字 id；保留兼容旧调用 */
  resolveReceivingColorId(productionOrderId: number): string {
    return (
      MOCK_SUPPLIER_PRODUCTION_COLOR_LEGACY_IDS[productionOrderId] ?? String(productionOrderId)
    );
  },

  /**
   * 供应商生产单统计。
   * - 首页进入：不传 productionOrderCode → 当前供应商全部
   * - 搜索选中回填：传 productionOrderCode → 该生产单统计
   */
  async getStatistic(params?: {
    productionOrderCode?: string;
    isOverTime?: boolean;
    status?: NonNullable<ReturnType<typeof tabToSupplierStatus>>[];
  }): Promise<ProductionOrderSupplierCount> {
    const data = await executeMockProductionOrderGraphql<{
      productionOrderSupplierStatistic: ProductionOrderSupplierCount;
    }>(PRODUCTION_ORDER_SUPPLIER_STATISTIC, {
      input: {
        ...(params?.productionOrderCode ? { productionOrderCode: params.productionOrderCode } : {}),
        ...(params?.isOverTime != null ? { isOverTime: params.isOverTime } : {}),
        ...(params?.status?.length ? { status: params.status } : {}),
      },
    });
    return data.productionOrderSupplierStatistic;
  },

  /** 关键字搜索生产单列表（搜索页） */
  async searchOrders(keyword: string): Promise<ProductionOrderView[]> {
    const q = keyword.trim();
    if (!q) return [];

    const data = await executeMockProductionOrderGraphql<{
      productionOrderSupplierSearch: ProductionOrderSupplierSearchResult;
    }>(PRODUCTION_ORDER_SUPPLIER_SEARCH, {
      input: { keyword: q, page: 1, size: 50 },
    });

    return data.productionOrderSupplierSearch.records.map((record) =>
      mapSearchRecordToOrderView(record),
    );
  },

  /** 关键字搜索原始 records（收发按色展开用） */
  async searchOrderRecords(keyword: string): Promise<ProductionOrderSupplierSearchResult> {
    const q = keyword.trim();
    if (!q) {
      return { total: 0, size: 50, pages: 0, page: 1, records: [] };
    }

    const data = await executeMockProductionOrderGraphql<{
      productionOrderSupplierSearch: ProductionOrderSupplierSearchResult;
    }>(PRODUCTION_ORDER_SUPPLIER_SEARCH, {
      input: { keyword: q, page: 1, size: 50 },
    });
    return data.productionOrderSupplierSearch;
  },

  /**
   * 订单查询首页列表 + Tab 统计。
   * - 统计：statistic 接口（可带 productionOrderCode）
   * - 列表：search 接口（按 Tab 传 isOverTime；状态 Tab 再本地过滤）
   */
  async listOrders(params: {
    keyword?: string;
    productionOrderCode?: string;
    tab: ProductionOrderTab;
    sort: DeliverySortOrder;
  }): Promise<ProductionOrderListResult> {
    // trim 后空串视为未传（|| 有意为之：空串不是 nullish）
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
    const productionOrderCode = params.productionOrderCode?.trim() || undefined;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string → undefined
    const keyword = productionOrderCode ? undefined : params.keyword?.trim() || undefined;
    const isOverTime = params.tab === 'overdue' ? true : undefined;

    const [searchData, statistic] = await Promise.all([
      executeMockProductionOrderGraphql<{
        productionOrderSupplierSearch: ProductionOrderSupplierSearchResult;
      }>(PRODUCTION_ORDER_SUPPLIER_SEARCH, {
        input: {
          page: 1,
          size: 50,
          ...(keyword ? { keyword } : {}),
          ...(productionOrderCode ? { productionOrderCode } : {}),
          ...(isOverTime ? { isOverTime: true } : {}),
        },
      }),
      this.getStatistic({
        ...(productionOrderCode ? { productionOrderCode } : {}),
      }),
    ]);

    return buildListResultFromSearchAndStatistic({
      records: searchData.productionOrderSupplierSearch.records,
      statistic,
      tab: params.tab,
      sort: params.sort,
    });
  },

  async getDetail(params: {
    productionOrderCode: string;
    color: string;
  }): Promise<ProductionOrderSupplierDetail> {
    const data = await executeMockProductionOrderGraphql<{
      productionOrderSupplierDetail: ProductionOrderSupplierDetail;
    }>(PRODUCTION_ORDER_SUPPLIER_DETAIL, {
      productionOrderCode: params.productionOrderCode,
      color: params.color,
    });
    return data.productionOrderSupplierDetail;
  },

  /**
   * 按生产色 id 取详情（Apps 跳转 / 会话回填）。
   * BFF 若无 by-id 接口，可改为先查 code+color 再 getDetail。
   */
  getDetailById(productionId: number): Promise<ProductionOrderSupplierDetail> {
    const detail = getMockDetailById(productionId);
    if (!detail) {
      return Promise.reject(new Error('生产单详情不存在'));
    }
    return Promise.resolve(detail);
  },

  async getDetailAsVO(params: {
    productionOrderCode: string;
    color: string;
  }): Promise<ProductionOrderVO> {
    const detail = await this.getDetail(params);
    return mapDetailToProductionOrderVO(detail);
  },

  async confirmArriveMaterial(
    productionId: number,
    input: ConfirmArriveMaterialInput,
  ): Promise<ProductionOrderSupplierDetail> {
    const data = await executeMockProductionOrderGraphql<{
      confirmArriveMaterial: ProductionOrderSupplierDetail;
    }>(CONFIRM_ARRIVE_MATERIAL, {
      productionId,
      input,
    });
    return data.confirmArriveMaterial;
  },

  async createExceptionRecord(input: CreateExceptionRecordInput): Promise<SupplierExceptionRecord> {
    const data = await executeMockProductionOrderGraphql<{
      createProductionOrderExceptionRecord: SupplierExceptionRecord;
    }>(CREATE_PRODUCTION_ORDER_EXCEPTION_RECORD, { input });
    return data.createProductionOrderExceptionRecord;
  },
};
