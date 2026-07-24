import {
  mapDetailToProductionColorDetail,
  mapDetailToProductionColorSummary,
  mapSearchRecordsToColorSummaries,
} from '@/services/apps/mapReceivingProductionOrder';
import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  getProductionColorById,
  getProductionColorByOrderAndColor,
  toSummary,
} from '@/services/receiving/mockCatalog';
import {
  cacheSupplierDetail,
  delay,
  enrichDetail,
  isSupplierProductionId,
  resolveSupplierDetail,
  seedInitialRecords,
  withState,
} from '@/services/receiving/receivingServiceShared';
import type { ProductionColorDetail, ProductionColorSummary } from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

export const receivingSessionService = {
  async getSelectedProductionColor(): Promise<ProductionColorSummary | null> {
    await delay();
    const state = await loadReceivingState();
    if (!state.selectedProductionColorId) return null;

    const supplierDetail = await resolveSupplierDetail(state.selectedProductionColorId);
    if (supplierDetail) {
      return mapDetailToProductionColorSummary(supplierDetail);
    }

    const detail = getProductionColorById(state.selectedProductionColorId);
    if (!detail) return null;
    seedInitialRecords(state, detail.id);
    await saveReceivingState(state);
    return toSummary(enrichDetail(state, detail));
  },

  /** 关键字查询生产单 → 按生产色展开（POST /api/production_orders/supplier/search） */
  async searchProductionColors(keyword: string): Promise<ProductionColorSummary[]> {
    const result = await productionOrderService.searchOrderRecords(keyword);
    return mapSearchRecordsToColorSummaries(result.records);
  },

  async resolveQrCode(content: string): Promise<ProductionColorDetail | null> {
    await delay();
    const trimmed = content.trim();
    if (!trimmed) return null;

    if (trimmed.includes('|')) {
      const [orderNo, color] = trimmed.split('|');
      if (orderNo && color) {
        try {
          const supplierDetail = await productionOrderService.getDetail({
            productionOrderCode: orderNo.trim(),
            color: color.trim(),
          });
          cacheSupplierDetail(supplierDetail);
          return mapDetailToProductionColorDetail(supplierDetail);
        } catch {
          const legacy = getProductionColorByOrderAndColor(orderNo.trim(), color.trim());
          return legacy ?? null;
        }
      }
    }

    if (isSupplierProductionId(trimmed)) {
      try {
        const supplierDetail = await productionOrderService.getDetailById(Number(trimmed));
        cacheSupplierDetail(supplierDetail);
        return mapDetailToProductionColorDetail(supplierDetail);
      } catch {
        // fall through
      }
    }

    return getProductionColorById(trimmed) ?? null;
  },

  /**
   * 按生产单号 + 颜色选中并回填首页。
   * GET /api/production_orders/supplier/{productionOrderCode}?color=
   */
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
    state.selectedProductionColorId = String(supplierDetail.id);
    await saveReceivingState(state);
    return mapDetailToProductionColorSummary(supplierDetail);
  },

  async selectProductionColor(id: string): Promise<ProductionColorSummary> {
    if (isSupplierProductionId(id)) {
      const supplierDetail = await productionOrderService.getDetailById(Number(id));
      cacheSupplierDetail(supplierDetail);
      const state = await loadReceivingState();
      state.selectedProductionColorId = String(supplierDetail.id);
      await saveReceivingState(state);
      return mapDetailToProductionColorSummary(supplierDetail);
    }

    return withState((state) => {
      const detail = getProductionColorById(id);
      if (!detail) throw new Error('生产色不存在');
      state.selectedProductionColorId = id;
      seedInitialRecords(state, id);
      return toSummary(enrichDetail(state, detail));
    });
  },

  async clearSelectedProductionColor(): Promise<void> {
    await withState((state) => {
      state.selectedProductionColorId = null;
    });
  },

  async getProductionColorDetail(id: string): Promise<ProductionColorDetail | null> {
    const supplierDetail = await resolveSupplierDetail(id);
    if (supplierDetail) {
      return mapDetailToProductionColorDetail(supplierDetail);
    }

    await delay();
    const state = await loadReceivingState();
    const detail = getProductionColorById(id);
    if (!detail) return null;
    seedInitialRecords(state, id);
    await saveReceivingState(state);
    return enrichDetail(state, detail);
  },
};
