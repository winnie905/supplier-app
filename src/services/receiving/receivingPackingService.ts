import { boxSpecificationService } from '@/services/apps/boxSpecificationService';
import { buildTailOrderPayload, mapTailOrderToPackingRecords } from '@/services/apps/mapTailOrder';
import { tailOrderService } from '@/services/apps/tailOrderService';
import {
  fetchFreshSupplierDetail,
  resolveSupplierDetail,
  sumQuantities,
  toWorkshopProductionRef,
} from '@/services/receiving/receivingServiceShared';
import { uniqueSizeNames } from '@/services/receiving/sizeQuantity';
import {
  persistWorkshopOrder,
  requireSupplierDetail,
  resolveWorkshopOrder,
} from '@/services/receiving/workshopOrderWrite';
import type { CartonSpec, PackingBoxRecord, PackingRecordsData } from '@/types/receiving';

/** 用箱规列表补齐提交所需 name / unit 等必填字段 */
const enrichBoxesWithCartonSpecs = (
  boxes: PackingBoxRecord[],
  specs: CartonSpec[],
): PackingBoxRecord[] => {
  const byId = new Map(specs.map((spec) => [spec.id, spec]));
  return boxes.map((box) => {
    if (!box.cartonSpecId) return box;
    const spec = byId.get(box.cartonSpecId);
    if (!spec) return box;
    return {
      ...box,
      cartonSpecType: box.cartonSpecType ?? spec.type,
      cartonSpecName: box.cartonSpecName ?? spec.name,
      cartonSpecUnit: box.cartonSpecUnit ?? spec.unit,
      cartonSpecLength: box.cartonSpecLength ?? spec.length,
      cartonSpecWidth: box.cartonSpecWidth ?? spec.width,
      cartonSpecHeight: box.cartonSpecHeight ?? spec.height,
    };
  });
};

export const receivingPackingService = {
  /** 读取装箱记录：优先用生产单详情内嵌 Preview，未提交草稿由页面内存维护 */
  async getPackingRecords(productionColorId: string): Promise<PackingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const sizes = uniqueSizeNames(
      supplierDetail.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
    );
    const existing = resolveWorkshopOrder(supplierDetail, 'tailOrder');

    if (existing) {
      const fromApi = mapTailOrderToPackingRecords(existing, productionColorId);
      return {
        ...fromApi,
        sizes: fromApi.sizes.length > 0 ? fromApi.sizes : sizes,
      };
    }

    return {
      productionColorId,
      boxes: [],
      sizes,
    };
  },

  /**
   * 提交装箱记录：无尾部单 → create；有 → update。
   * 入参为页面当前全部箱子（含待提交），方法内校验并标记目标箱子后写后端。
   */
  async submitPackingRecords(
    productionColorId: string,
    boxes: PackingBoxRecord[],
    targetIds: string[],
  ): Promise<PackingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const now = new Date().toISOString();
    const nextBoxes = boxes.map((box) => {
      if (!targetIds.includes(box.id)) return box;
      if (!box.cartonSpecId) throw new Error('NO_CARTON');
      const total = sumQuantities(box.sizeQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      return { ...box, submitted: true, submittedAt: box.submittedAt ?? now };
    });

    const freshDetail = await fetchFreshSupplierDetail(supplierDetail);
    const cartonSpecs =
      await receivingPackingService.getCartonSpecsForProductionColor(productionColorId);
    const enrichedBoxes = enrichBoxesWithCartonSpecs(nextBoxes, cartonSpecs);
    const existing = resolveWorkshopOrder(freshDetail, 'tailOrder');
    const payload = buildTailOrderPayload({
      existing,
      boxes: enrichedBoxes,
      productionOrder: toWorkshopProductionRef(freshDetail),
    });

    await persistWorkshopOrder({
      detail: freshDetail,
      existing,
      payload,
      service: tailOrderService,
      key: 'tailOrder',
    });

    return receivingPackingService.getPackingRecords(productionColorId);
  },

  /** 按生产色品牌拉取箱规（更换箱规格窗） */
  async getCartonSpecsForProductionColor(productionColorId: string): Promise<CartonSpec[]> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    const brandId =
      supplierDetail?.customerPurchaseOrder?.brand?.id ?? supplierDetail?.templateDesign?.brand?.id;
    if (brandId == null) return [];

    return boxSpecificationService.getCartonSpecsByBrand({
      brandId,
      includeGeneral: true,
    });
  },
};
