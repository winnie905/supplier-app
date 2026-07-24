import { cropOrderService } from '@/services/apps/cropOrderService';
import { buildCropOrderPayload, mapCropOrderToCuttingRecords } from '@/services/apps/mapCropOrder';
import { mapExceptionRecordToFactoryException } from '@/services/apps/mapReceivingProductionOrder';
import { productionOrderService } from '@/services/apps/productionOrderService';
import { getProductionColorById } from '@/services/receiving/mockCatalog';
import {
  createId,
  isSupplierProductionId,
  resolveSupplierDetail,
  seedInitialRecords,
  sumQuantities,
  toWorkshopProductionRef,
  withState,
} from '@/services/receiving/receivingServiceShared';
import type { CuttingBedRecord, CuttingRecordsData, FactoryException } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

export const receivingCuttingService = {
  async getCuttingRecords(productionColorId: string): Promise<CuttingRecordsData> {
    const state = await loadReceivingState();
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    const legacyDetail = getProductionColorById(productionColorId);
    if (!supplierDetail && !legacyDetail) throw new Error('生产色不存在');

    // 统计（按生产单号）
    if (supplierDetail?.productionOrderCode) {
      await cropOrderService.getStatistic({
        productionOrderCode: supplierDetail.productionOrderCode,
      });
    }

    if (isSupplierProductionId(productionColorId)) {
      const orderId = Number(productionColorId);
      const existing = await cropOrderService.tryGetById(orderId);
      const fromApi = existing
        ? mapCropOrderToCuttingRecords(existing, productionColorId)
        : {
            productionColorId,
            beds: [] as CuttingBedRecord[],
            quantity: supplierDetail?.customerPurchaseOrder?.quantity ?? 0,
            sizes: supplierDetail?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
          };

      const localBeds = state.cuttingBeds[productionColorId] ?? [];
      const apiIds = new Set(fromApi.beds.map((bed) => bed.id));
      const drafts = localBeds.filter((bed) => !bed.submitted && !apiIds.has(bed.id));
      const beds = [...fromApi.beds, ...drafts];

      state.cuttingBeds[productionColorId] = beds;
      await saveReceivingState(state);

      return {
        ...fromApi,
        beds,
        ...(state.cuttingEditingBedId[productionColorId]
          ? { editingBedId: state.cuttingEditingBedId[productionColorId] }
          : {}),
      };
    }

    if (legacyDetail) {
      seedInitialRecords(state, productionColorId);
    }
    state.cuttingBeds[productionColorId] ??= [];
    await saveReceivingState(state);

    return {
      productionColorId,
      beds: state.cuttingBeds[productionColorId],
      ...(state.cuttingEditingBedId[productionColorId]
        ? { editingBedId: state.cuttingEditingBedId[productionColorId] }
        : {}),
      quantity: legacyDetail?.quantity ?? 0,
      sizes: legacyDetail ? sizeNamesFromRange(legacyDetail.sizeRange) : [],
    };
  },

  async saveCuttingDraft(
    productionColorId: string,
    beds: CuttingBedRecord[],
    editingBedId?: string,
  ): Promise<void> {
    await withState((state) => {
      state.cuttingBeds[productionColorId] = beds;
      state.cuttingEditingBedId[productionColorId] = editingBedId;
    });
  },

  /**
   * 提交裁床记录：无已提交记录 → create；有 → update。
   * 入参为页面当前全部床次（含待提交），方法内校验并标记目标床次后落库。
   */
  async submitCuttingRecords(
    productionColorId: string,
    beds: CuttingBedRecord[],
    targetIds: string[],
  ): Promise<CuttingRecordsData> {
    const now = new Date().toISOString();
    const nextBeds = beds.map((bed) => {
      if (!targetIds.includes(bed.id)) return bed;
      const total = sumQuantities(bed.sizeQuantities);
      if (total <= 0 && bed.bundleCount <= 0) {
        throw new Error('EMPTY_FORM');
      }
      return { ...bed, submitted: true, submittedAt: bed.submittedAt ?? now };
    });

    const state = await loadReceivingState();
    state.cuttingBeds[productionColorId] = nextBeds;
    state.cuttingEditingBedId[productionColorId] = undefined;
    await saveReceivingState(state);

    if (isSupplierProductionId(productionColorId)) {
      const orderId = Number(productionColorId);
      const existing = await cropOrderService.tryGetById(orderId);
      const supplierDetail = await resolveSupplierDetail(productionColorId);
      const payload = buildCropOrderPayload({
        existing,
        orderId,
        beds: nextBeds,
        ...(supplierDetail ? { productionOrder: toWorkshopProductionRef(supplierDetail) } : {}),
      });
      const hadSubmittedBefore = (existing?.cropOrderStorage?.cropProcesses?.length ?? 0) > 0;
      if (hadSubmittedBefore) {
        await cropOrderService.update(payload);
      } else {
        await cropOrderService.create(payload);
      }
      if (supplierDetail?.productionOrderCode) {
        await cropOrderService.getStatistic({
          productionOrderCode: supplierDetail.productionOrderCode,
        });
      }
    }

    return receivingCuttingService.getCuttingRecords(productionColorId);
  },

  /** @deprecated 请用 submitCuttingRecords；保留兼容单床次调用 */
  async submitCuttingBed(productionColorId: string, bedId: string): Promise<CuttingBedRecord> {
    const state = await loadReceivingState();
    const beds = state.cuttingBeds[productionColorId] ?? [];
    await receivingCuttingService.submitCuttingRecords(productionColorId, beds, [bedId]);
    const refreshed = await receivingCuttingService.getCuttingRecords(productionColorId);
    const bed = refreshed.beds.find((item) => item.id === bedId);
    if (!bed) throw new Error('床次不存在');
    return bed;
  },

  async submitCuttingException(input: {
    productionColorId: string;
    type: string;
    description: string;
  }): Promise<FactoryException> {
    if (isSupplierProductionId(input.productionColorId)) {
      const record = await productionOrderService.createExceptionRecord({
        productionId: Number(input.productionColorId),
        module: 'cutting',
        type: input.type,
        reportContent: input.description,
        reporter: { id: 1, username: 'factory', firstName: '工', lastName: '厂' },
      });
      return mapExceptionRecordToFactoryException(record, input.productionColorId);
    }

    return withState((state) => {
      const exception: FactoryException = {
        id: createId('exc'),
        productionColorId: input.productionColorId,
        module: 'cutting',
        type: input.type,
        status: 'pending',
        reporter: '当前用户',
        reportedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        content: '裁床异常',
        description: input.description,
      };
      state.exceptions.push(exception);
      return exception;
    });
  },
};
