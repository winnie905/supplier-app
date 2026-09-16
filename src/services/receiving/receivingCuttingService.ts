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
  toWorkshopProductionRef,
} from '@/services/receiving/receivingServiceShared';
import {
  fillUnfilledSizeQuantities,
  isBlankSizeQuantities,
  uniqueSizeNames,
} from '@/services/receiving/sizeQuantity';
import {
  persistWorkshopOrder,
  requireSupplierDetail,
  resolveWorkshopOrder,
} from '@/services/receiving/workshopOrderWrite';
import type { CuttingBedRecord, CuttingRecordsData, FactoryException } from '@/types/receiving';

/** 扎数与全部尺码都未填写（空着，不是用户输入的 0） */
const isBlankCuttingBed = (bed: CuttingBedRecord) =>
  bed.bundleCount == null && isBlankSizeQuantities(bed.sizeQuantities);

const fillUnfilledCuttingQuantities = (bed: CuttingBedRecord): CuttingBedRecord => ({
  ...bed,
  bundleCount: bed.bundleCount ?? 0,
  sizeQuantities: fillUnfilledSizeQuantities(bed.sizeQuantities),
});

export const receivingCuttingService = {
  /** 读取裁床记录：优先用生产单详情内嵌 Preview，未提交草稿由页面内存维护 */
  async getCuttingRecords(productionColorId: string): Promise<CuttingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);
    const quantity = supplierDetail.customerPurchaseOrder?.quantity ?? 0;
    const sizes = uniqueSizeNames(
      supplierDetail.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
    );

    const existing = resolveWorkshopOrder(supplierDetail, 'cropOrder');
    if (existing) {
      const fromApi = mapCropOrderToCuttingRecords(existing, productionColorId);
      return {
        ...fromApi,
        quantity,
        sizes: sizes.length > 0 ? sizes : fromApi.sizes,
      };
    }

    return {
      productionColorId,
      beds: [],
      quantity,
      sizes,
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
    const targetBeds = beds.filter((bed) => targetIds.includes(bed.id));
    const filledTargets = targetBeds.filter((bed) => !isBlankCuttingBed(bed));
    if (filledTargets.length === 0) {
      throw new Error('EMPTY_FORM');
    }

    const filledIds = new Set(filledTargets.map((bed) => bed.id));
    const nextBeds = beds.map((bed) => {
      if (!filledIds.has(bed.id)) return bed;
      return {
        ...fillUnfilledCuttingQuantities(bed),
        submitted: true,
        submittedAt: bed.submittedAt ?? now,
      };
    });

    // 提交前刷新详情，确保拿到最新 cropOrder Preview
    const freshDetail = await fetchFreshSupplierDetail(supplierDetail);
    const existing = resolveWorkshopOrder(freshDetail, 'cropOrder');
    const payload = buildCropOrderPayload({
      existing,
      beds: nextBeds,
      productionOrder: toWorkshopProductionRef(freshDetail),
      audit: {
        targetIds,
        maintainer: currentExceptionReporter(),
        maintenanceDate: now,
      },
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
