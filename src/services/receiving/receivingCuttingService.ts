import { EXCEPTION_MODULE_LABELS } from '@/constants/receiving';
import { cropOrderService } from '@/services/apps/cropOrderService';
import { buildCropOrderPayload, mapCropOrderToCuttingRecords } from '@/services/apps/mapCropOrder';
import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  buildCuttingExceptionModuleExtend,
  mapExceptionRecordToFactoryException,
} from '@/services/receiving/mapReceivingProductionOrder';
import {
  currentExceptionReporter,
  fetchFreshSupplierDetail,
  resolveProductionId,
  sumQuantities,
  toWorkshopProductionRef,
} from '@/services/receiving/receivingServiceShared';
import { uniqueSizeNames } from '@/services/receiving/sizeQuantity';
import {
  persistWorkshopOrder,
  requireSupplierDetail,
  resolveWorkshopOrder,
} from '@/services/receiving/workshopOrderWrite';
import type { CuttingBedRecord, CuttingRecordsData, FactoryException } from '@/types/receiving';

export const receivingCuttingService = {
  /** 读取裁床记录：优先用生产单详情内嵌 Preview，未提交草稿由页面内存维护 */
  async getCuttingRecords(productionColorId: string): Promise<CuttingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const existing = resolveWorkshopOrder(supplierDetail, 'cropOrder');
    if (existing) {
      return mapCropOrderToCuttingRecords(existing, productionColorId);
    }

    return {
      productionColorId,
      beds: [],
      quantity: supplierDetail.customerPurchaseOrder?.quantity ?? 0,
      sizes: uniqueSizeNames(
        supplierDetail.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
      ),
    };
  },

  /**
   * 提交裁床记录：无已提交记录 → create；有 → update。
   * 入参为页面当前全部床次（含待提交），方法内校验并标记目标床次后写后端。
   */
  async submitCuttingRecords(
    productionColorId: string,
    beds: CuttingBedRecord[],
    targetIds: string[],
  ): Promise<CuttingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const now = new Date().toISOString();
    const nextBeds = beds.map((bed) => {
      if (!targetIds.includes(bed.id)) return bed;
      const total = sumQuantities(bed.sizeQuantities);
      if (total <= 0 && bed.bundleCount <= 0) {
        throw new Error('EMPTY_FORM');
      }
      return { ...bed, submitted: true, submittedAt: bed.submittedAt ?? now };
    });

    // 提交前刷新详情，确保拿到最新 cropOrder Preview
    const freshDetail = await fetchFreshSupplierDetail(supplierDetail);
    const existing = resolveWorkshopOrder(freshDetail, 'cropOrder');
    const payload = buildCropOrderPayload({
      existing,
      beds: nextBeds,
      productionOrder: toWorkshopProductionRef(freshDetail),
    });

    await persistWorkshopOrder({
      detail: freshDetail,
      existing,
      payload,
      service: cropOrderService,
      key: 'cropOrder',
    });

    return receivingCuttingService.getCuttingRecords(productionColorId);
  },

  async submitCuttingException(input: {
    productionColorId: string;
    type: string;
    description: string;
  }): Promise<FactoryException> {
    const productionId = await resolveProductionId(input.productionColorId);
    if (productionId == null) {
      throw new Error('生产色不存在');
    }

    const record = await productionOrderService.createExceptionRecord({
      productionId,
      module: EXCEPTION_MODULE_LABELS.cutting,
      type: input.type,
      reporter: currentExceptionReporter(),
      moduleExtend: buildCuttingExceptionModuleExtend({
        description: input.description,
      }),
    });
    return mapExceptionRecordToFactoryException(record, input.productionColorId);
  },
};
