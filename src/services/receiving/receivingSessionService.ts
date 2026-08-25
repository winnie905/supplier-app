import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  mapDetailToProductionColorDetail,
  mapDetailToProductionColorSummary,
  mapSearchRecordsToColorSummaries,
} from '@/services/receiving/mapReceivingProductionOrder';
import {
  cacheSupplierDetail,
  resolveSupplierDetail,
} from '@/services/receiving/receivingServiceShared';
import type { ProductionColorDetail, ProductionColorSummary } from '@/types/receiving';
import { parseProductionQrContent } from '@/utils/receiving/parseProductionQrContent';
import {
  decodeProductionColorId,
  encodeProductionColorId,
} from '@/utils/receiving/productionColorId';
import { loadReceivingState, saveReceivingState, withState } from '@/utils/receiving/storage';

export const receivingSessionService = {
  async getSelectedProductionColor(options?: {
    /** 跳过会话缓存，强制拉最新生产单详情（含模块统计） */
    force?: boolean;
  }): Promise<ProductionColorSummary | null> {
    const state = await loadReceivingState();
    if (!state.selectedProductionColorId) return null;

    if (options?.force) {
      const ref = decodeProductionColorId(state.selectedProductionColorId);
      if (!ref) return null;
      try {
        const detail = await productionOrderService.getDetail(ref);
        cacheSupplierDetail(detail);
        return mapDetailToProductionColorSummary(detail);
      } catch {
        return null;
      }
    }

    const supplierDetail = await resolveSupplierDetail(state.selectedProductionColorId);
    if (!supplierDetail) return null;
    return mapDetailToProductionColorSummary(supplierDetail);
  },

  /** 关键字查询生产单 → 按生产色展开 */
  async searchProductionColors(keyword: string): Promise<ProductionColorSummary[]> {
    const result = await productionOrderService.searchOrderRecords(keyword);
    return mapSearchRecordsToColorSummaries(result.records);
  },

  /** 扫码解析：按生产单号 + 颜色拉取生产单详情 */
  async resolveQrCode(content: string): Promise<ProductionColorDetail | null> {
    const params = parseProductionQrContent(content);
    if (!params) return null;

    try {
      const supplierDetail = await productionOrderService.getDetail({
        productionOrderCode: params.productionOrderCode,
        color: params.color,
      });
      cacheSupplierDetail(supplierDetail);
      return mapDetailToProductionColorDetail(supplierDetail);
    } catch {
      return null;
    }
  },

  /** 按生产单号 + 颜色选中并回填首页 */
  async selectProductionColorByOrderAndColor(
    productionOrderCode: string,
    color: string,
  ): Promise<ProductionColorSummary> {
    const supplierDetail = await productionOrderService.getDetail({
      productionOrderCode,
      color,
    });
    cacheSupplierDetail(supplierDetail);
    const state = await loadReceivingState();
    state.selectedProductionColorId = encodeProductionColorId(supplierDetail);
    await saveReceivingState(state);
    return mapDetailToProductionColorSummary(supplierDetail);
  },

  async selectProductionColor(id: string): Promise<ProductionColorSummary> {
    const ref = decodeProductionColorId(id);
    if (!ref) throw new Error('生产色不存在');

    return receivingSessionService.selectProductionColorByOrderAndColor(
      ref.productionOrderCode,
      ref.color,
    );
  },

  async clearSelectedProductionColor(): Promise<void> {
    await withState((state) => {
      state.selectedProductionColorId = null;
    });
  },

  async getProductionColorDetail(id: string): Promise<ProductionColorDetail | null> {
    const supplierDetail = await resolveSupplierDetail(id);
    if (!supplierDetail) return null;
    return mapDetailToProductionColorDetail(supplierDetail);
  },
};
