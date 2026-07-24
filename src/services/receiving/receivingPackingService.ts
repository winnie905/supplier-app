import { boxSpecificationService } from '@/services/apps/boxSpecificationService';
import { buildTailOrderPayload, mapTailOrderToPackingRecords } from '@/services/apps/mapTailOrder';
import { tailOrderService } from '@/services/apps/tailOrderService';
import { getProductionColorById, MOCK_CARTON_SPECS } from '@/services/receiving/mockCatalog';
import {
  isSupplierProductionId,
  resolveSupplierDetail,
  seedInitialRecords,
  sumQuantities,
  toWorkshopProductionRef,
  withState,
} from '@/services/receiving/receivingServiceShared';
import type { CartonSpec, PackingBoxRecord, PackingRecordsData } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

export const receivingPackingService = {
  async getPackingRecords(productionColorId: string): Promise<PackingRecordsData> {
    const state = await loadReceivingState();
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    const legacyDetail = getProductionColorById(productionColorId);
    if (!supplierDetail && !legacyDetail) throw new Error('生产色不存在');

    if (supplierDetail?.productionOrderCode) {
      await tailOrderService.getStatistic({
        productionOrderCode: supplierDetail.productionOrderCode,
      });
    }

    if (isSupplierProductionId(productionColorId)) {
      const existing = await tailOrderService.tryGetById(Number(productionColorId));
      const fromApi = existing
        ? mapTailOrderToPackingRecords(existing, productionColorId)
        : {
            productionColorId,
            boxes: [] as PackingBoxRecord[],
            sizes: supplierDetail?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
          };

      const localBoxes = state.packingBoxes[productionColorId] ?? [];
      const apiIds = new Set(fromApi.boxes.map((box) => box.id));
      const drafts = localBoxes.filter((box) => !box.submitted && !apiIds.has(box.id));
      const boxes = [...fromApi.boxes, ...drafts];

      state.packingBoxes[productionColorId] = boxes;
      await saveReceivingState(state);

      return {
        ...fromApi,
        boxes,
        ...(state.packingEditingBoxId[productionColorId]
          ? { editingBoxId: state.packingEditingBoxId[productionColorId] }
          : {}),
      };
    }

    if (legacyDetail) {
      seedInitialRecords(state, productionColorId);
    }
    state.packingBoxes[productionColorId] ??= [];
    await saveReceivingState(state);

    return {
      productionColorId,
      boxes: state.packingBoxes[productionColorId],
      ...(state.packingEditingBoxId[productionColorId]
        ? { editingBoxId: state.packingEditingBoxId[productionColorId] }
        : {}),
      sizes: legacyDetail ? sizeNamesFromRange(legacyDetail.sizeRange) : [],
    };
  },

  async savePackingDraft(
    productionColorId: string,
    boxes: PackingBoxRecord[],
    editingBoxId?: string,
  ): Promise<void> {
    await withState((state) => {
      state.packingBoxes[productionColorId] = boxes;
      state.packingEditingBoxId[productionColorId] = editingBoxId;
    });
  },

  async submitPackingRecords(
    productionColorId: string,
    boxes: PackingBoxRecord[],
    targetIds: string[],
  ): Promise<PackingRecordsData> {
    const now = new Date().toISOString();
    const nextBoxes = boxes.map((box) => {
      if (!targetIds.includes(box.id)) return box;
      if (!box.cartonSpecId) throw new Error('NO_CARTON');
      const total = sumQuantities(box.sizeQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      return { ...box, submitted: true, submittedAt: box.submittedAt ?? now };
    });

    const state = await loadReceivingState();
    state.packingBoxes[productionColorId] = nextBoxes;
    state.packingEditingBoxId[productionColorId] = undefined;
    await saveReceivingState(state);

    if (isSupplierProductionId(productionColorId)) {
      const orderId = Number(productionColorId);
      const existing = await tailOrderService.tryGetById(orderId);
      const supplierDetail = await resolveSupplierDetail(productionColorId);
      const payload = buildTailOrderPayload({
        existing,
        orderId,
        boxes: nextBoxes,
        ...(supplierDetail ? { productionOrder: toWorkshopProductionRef(supplierDetail) } : {}),
      });
      const hadSubmittedBefore =
        (existing?.tailOrderStorage?.cropProcesses?.length ?? 0) > 0 ||
        (existing?.cropOrderStorage?.cropProcesses?.length ?? 0) > 0;
      if (hadSubmittedBefore) {
        await tailOrderService.update(payload);
      } else {
        await tailOrderService.create(payload);
      }
      if (supplierDetail?.productionOrderCode) {
        await tailOrderService.getStatistic({
          productionOrderCode: supplierDetail.productionOrderCode,
        });
      }
    }

    return receivingPackingService.getPackingRecords(productionColorId);
  },

  async submitPackingBox(productionColorId: string, boxId: string): Promise<PackingBoxRecord> {
    const state = await loadReceivingState();
    const boxes = state.packingBoxes[productionColorId] ?? [];
    await receivingPackingService.submitPackingRecords(productionColorId, boxes, [boxId]);
    const refreshed = await receivingPackingService.getPackingRecords(productionColorId);
    const box = refreshed.boxes.find((item) => item.id === boxId);
    if (!box) throw new Error('箱子不存在');
    return box;
  },

  getCartonSpecs() {
    return MOCK_CARTON_SPECS;
  },

  /** 按生产色品牌拉取箱规（更换箱规格窗） */
  async getCartonSpecsForProductionColor(productionColorId: string): Promise<CartonSpec[]> {
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    const brandId =
      supplierDetail?.customerPurchaseOrder?.brand?.id ?? supplierDetail?.templateDesign?.brand?.id;
    if (brandId != null) {
      return boxSpecificationService.getCartonSpecsByBrand({
        brandId,
        includeGeneral: true,
      });
    }
    return MOCK_CARTON_SPECS;
  },
};
