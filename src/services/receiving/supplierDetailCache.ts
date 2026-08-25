import { productionOrderService } from '@/services/apps/productionOrderService';
import type { ProductionOrderSupplierDetail } from '@/types/supplierProductionOrder';
import {
  decodeProductionColorId,
  encodeProductionColorId,
} from '@/utils/receiving/productionColorId';

/** 会话内缓存：生产色 id（生产单号::颜色）→ 供应商详情 */
const supplierDetailCache = new Map<string, ProductionOrderSupplierDetail>();

/** 可回查详情的供应商生产色 id（生产单号::颜色） */
export const isSupplierProductionId = (id: string) => decodeProductionColorId(id) != null;

export const cacheSupplierDetail = (detail: ProductionOrderSupplierDetail) => {
  supplierDetailCache.set(encodeProductionColorId(detail), detail);
  return detail;
};

export const resolveSupplierDetail = async (
  productionColorId: string,
): Promise<ProductionOrderSupplierDetail | null> => {
  const cached = supplierDetailCache.get(productionColorId);
  if (cached) return cached;

  const ref = decodeProductionColorId(productionColorId);
  if (!ref) return null;

  try {
    const detail = await productionOrderService.getDetail(ref);
    return cacheSupplierDetail(detail);
  } catch {
    return null;
  }
};

/** 生产色 id → 后端生产色数字 id（裁/缝/尾单等工单接口入参） */
export const resolveProductionId = async (productionColorId: string): Promise<number | null> => {
  const detail = await resolveSupplierDetail(productionColorId);
  return detail?.id ?? null;
};

/** 同屏并发 getDetail 合并为一次；提交后仍会走新的请求 */
const freshDetailInflight = new Map<string, Promise<ProductionOrderSupplierDetail>>();

export const fetchFreshSupplierDetail = async (
  supplierDetail: ProductionOrderSupplierDetail,
): Promise<ProductionOrderSupplierDetail> => {
  const key = encodeProductionColorId(supplierDetail);
  const existing = freshDetailInflight.get(key);
  if (existing) return existing;

  const promise = productionOrderService
    .getDetail({
      productionOrderCode: supplierDetail.productionOrderCode,
      color: supplierDetail.color,
    })
    .then((fresh) => cacheSupplierDetail(fresh))
    .finally(() => {
      freshDetailInflight.delete(key);
    });

  freshDetailInflight.set(key, promise);
  return promise;
};
