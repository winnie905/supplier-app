import type { WorkshopOrderService } from '@/services/apps/workshopOrderService';
import {
  cacheSupplierDetail,
  resolveSupplierDetail,
} from '@/services/receiving/supplierDetailCache';
import type { CropOrder } from '@/types/cropOrder';
import type { ProductionOrderSupplierDetail } from '@/types/supplierProductionOrder';

/** 详情上挂载工单 Preview 的字段：裁床 / 车缝 / 尾部 */
type WorkshopOrderKey = 'cropOrder' | 'sewingOrder' | 'tailOrder';

/** 读写前都要先拿到生产色详情，取不到即无法继续 */
export const requireSupplierDetail = async (
  productionColorId: string,
): Promise<ProductionOrderSupplierDetail> => {
  const detail = await resolveSupplierDetail(productionColorId);
  if (!detail) throw new Error('生产色不存在');
  return detail;
};

/** 生产单详情上的完整工单 Preview；无 id 则视为未创建 */
export const resolveWorkshopOrder = (
  detail: ProductionOrderSupplierDetail,
  key: WorkshopOrderKey,
): CropOrder | null => {
  const order = detail[key];
  return order?.id != null && order.id > 0 ? order : null;
};

/** 有单则 update，无单则 create，写入结果回填详情缓存 */
export const persistWorkshopOrder = async <T extends CropOrder>(params: {
  detail: ProductionOrderSupplierDetail;
  existing: CropOrder | null;
  payload: T;
  service: WorkshopOrderService<T>;
  key: WorkshopOrderKey;
}): Promise<void> => {
  const { detail, existing, payload, service, key } = params;
  const saved =
    existing?.id != null && existing.id > 0
      ? await service.update(payload)
      : await service.create(payload);

  cacheSupplierDetail({ ...detail, [key]: saved });
};
