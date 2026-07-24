import {
  mapSewingDayToCropProcesses,
  mapSewOrderToSewingRecords,
} from '@/services/apps/mapSewOrder';
import { sewOrderService } from '@/services/apps/sewOrderService';
import { getProductionColorById } from '@/services/receiving/mockCatalog';
import {
  createId,
  emptySizeQuantities,
  isSupplierProductionId,
  resolveSupplierDetail,
  seedInitialRecords,
  sumQuantities,
  todayString,
  toWorkshopProductionRef,
  withState,
} from '@/services/receiving/receivingServiceShared';
import type { SewingDayRecord, SewingRecordsData, SizeQuantity } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

export const receivingSewingService = {
  async getSewingRecords(productionColorId: string): Promise<SewingRecordsData> {
    const state = await loadReceivingState();
    const supplierDetail = await resolveSupplierDetail(productionColorId);
    const legacyDetail = getProductionColorById(productionColorId);
    if (!supplierDetail && !legacyDetail) throw new Error('生产色不存在');

    const today = todayString();
    const sizes =
      supplierDetail?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ??
      (legacyDetail ? sizeNamesFromRange(legacyDetail.sizeRange) : []);

    if (supplierDetail?.productionOrderCode) {
      await sewOrderService.getStatistic({
        productionOrderCode: supplierDetail.productionOrderCode,
      });
    }

    if (isSupplierProductionId(productionColorId)) {
      const existing = await sewOrderService.tryGetById(Number(productionColorId));
      const fromApi = existing
        ? mapSewOrderToSewingRecords(existing, productionColorId, today)
        : { productionColorId, records: [] as SewingDayRecord[], sizes, today };

      const ensureSizes = (values: SizeQuantity[]) =>
        sizes.map((size) => ({
          size,
          quantity: values.find((item) => item.size === size)?.quantity ?? 0,
        }));

      let records = fromApi.records.map((record) => ({
        ...record,
        upQuantities: ensureSizes(record.upQuantities),
        downQuantities: ensureSizes(record.downQuantities),
      }));

      const hasToday = records.some((record) => record.date === today);
      if (!hasToday && sizes.length > 0) {
        records = [
          {
            id: createId('sew'),
            date: today,
            upQuantities: emptySizeQuantities(sizes),
            downQuantities: emptySizeQuantities(sizes),
            submitted: false,
          },
          ...records,
        ];
      }

      const local = state.sewingRecords[productionColorId] ?? [];
      const apiIds = new Set(records.filter((r) => r.submitted).map((r) => r.id));
      const localDrafts = local.filter((r) => !r.submitted && !apiIds.has(r.id));
      for (const draft of localDrafts) {
        if (!records.some((r) => r.id === draft.id || r.date === draft.date)) {
          records.push(draft);
        }
      }

      state.sewingRecords[productionColorId] = records;
      await saveReceivingState(state);

      return {
        productionColorId,
        records,
        sizes: fromApi.sizes.length ? fromApi.sizes : sizes,
        today,
      };
    }

    if (legacyDetail) {
      seedInitialRecords(state, productionColorId);
    }
    state.sewingRecords[productionColorId] ??= [
      {
        id: createId('sew'),
        date: today,
        upQuantities: emptySizeQuantities(sizes),
        downQuantities: emptySizeQuantities(sizes),
        submitted: false,
      },
    ];
    await saveReceivingState(state);
    return {
      productionColorId,
      records: state.sewingRecords[productionColorId],
      sizes,
      today,
    };
  },

  async saveSewingRecords(productionColorId: string, records: SewingDayRecord[]): Promise<void> {
    await withState((state) => {
      state.sewingRecords[productionColorId] = records;
    });
  },

  async submitSewingRecords(
    productionColorId: string,
    records: SewingDayRecord[],
    targetIds: string[],
  ): Promise<SewingRecordsData> {
    const now = new Date().toISOString();
    const nextRecords = records.map((record) => {
      if (!targetIds.includes(record.id)) return record;
      const total = sumQuantities(record.upQuantities) + sumQuantities(record.downQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      return { ...record, submitted: true, submittedAt: record.submittedAt ?? now };
    });

    const state = await loadReceivingState();
    state.sewingRecords[productionColorId] = nextRecords;
    await saveReceivingState(state);

    if (isSupplierProductionId(productionColorId)) {
      const orderId = Number(productionColorId);
      const existing = await sewOrderService.tryGetById(orderId);
      const supplierDetail = await resolveSupplierDetail(productionColorId);
      const processes = nextRecords
        .filter((record) => record.submitted)
        .flatMap(mapSewingDayToCropProcesses);

      const payload = {
        id: existing?.id && existing.id > 0 ? existing.id : orderId,
        status: existing?.status ?? 'InProgress',
        cropOrderType: 'CROP_ORDER' as const,
        ...(existing?.productionOrder || supplierDetail
          ? {
              productionOrder:
                existing?.productionOrder ?? toWorkshopProductionRef(supplierDetail!),
            }
          : {}),
        cropOrderStorage: { cropProcesses: processes },
      };

      if (existing && (existing.cropOrderStorage?.cropProcesses?.length ?? 0) > 0) {
        await sewOrderService.update(payload);
      } else {
        await sewOrderService.create(payload);
      }
      if (supplierDetail?.productionOrderCode) {
        await sewOrderService.getStatistic({
          productionOrderCode: supplierDetail.productionOrderCode,
        });
      }
    }

    return receivingSewingService.getSewingRecords(productionColorId);
  },

  async submitSewingRecord(productionColorId: string, recordId: string): Promise<SewingDayRecord> {
    const state = await loadReceivingState();
    const records = state.sewingRecords[productionColorId] ?? [];
    await receivingSewingService.submitSewingRecords(productionColorId, records, [recordId]);
    const refreshed = await receivingSewingService.getSewingRecords(productionColorId);
    const record = refreshed.records.find((item) => item.id === recordId);
    if (!record) throw new Error('记录不存在');
    return record;
  },
};
