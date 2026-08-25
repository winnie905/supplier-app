import { buildSewOrderPayload, mapSewOrderToSewingRecords } from '@/services/apps/mapSewOrder';
import { sewOrderService } from '@/services/apps/sewOrderService';
import {
  fetchFreshSupplierDetail,
  sumQuantities,
  todayString,
  toWorkshopProductionRef,
} from '@/services/receiving/receivingServiceShared';
import { uniqueSizeNames } from '@/services/receiving/sizeQuantity';
import {
  persistWorkshopOrder,
  requireSupplierDetail,
  resolveWorkshopOrder,
} from '@/services/receiving/workshopOrderWrite';
import type { SewingDayRecord, SewingRecordsData } from '@/types/receiving';

const ensureRecordSizes = (record: SewingDayRecord, sizes: string[]): SewingDayRecord => ({
  ...record,
  upQuantities: sizes.map((size) => ({
    size,
    quantity: record.upQuantities.find((item) => item.size === size)?.quantity ?? 0,
  })),
  downQuantities: sizes.map((size) => ({
    size,
    quantity: record.downQuantities.find((item) => item.size === size)?.quantity ?? 0,
  })),
});

export const receivingSewingService = {
  /** 读取车位记录：优先用生产单详情内嵌 Preview，未提交草稿由页面内存维护 */
  async getSewingRecords(productionColorId: string): Promise<SewingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const today = todayString();
    const sizes = uniqueSizeNames(
      supplierDetail.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ?? [],
    );
    const existing = resolveWorkshopOrder(supplierDetail, 'sewingOrder');

    if (existing) {
      const fromApi = mapSewOrderToSewingRecords(existing, productionColorId, today);
      return {
        ...fromApi,
        sizes: fromApi.sizes.length > 0 ? fromApi.sizes : sizes,
        records: fromApi.records.map((record) =>
          ensureRecordSizes(record, sizes.length ? sizes : fromApi.sizes),
        ),
      };
    }

    return {
      productionColorId,
      records: [],
      sizes,
      today,
    };
  },

  /**
   * 提交车位记录：无车缝单 → create；有 → update。
   * 入参为页面当前全部日记录（含待提交），方法内校验并标记目标记录后写后端。
   */
  async submitSewingRecords(
    productionColorId: string,
    records: SewingDayRecord[],
    targetIds: string[],
  ): Promise<SewingRecordsData> {
    const supplierDetail = await requireSupplierDetail(productionColorId);

    const now = new Date().toISOString();
    const nextRecords = records.map((record) => {
      if (!targetIds.includes(record.id)) return record;
      const total = sumQuantities(record.upQuantities) + sumQuantities(record.downQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      return { ...record, submitted: true, submittedAt: record.submittedAt ?? now };
    });

    const freshDetail = await fetchFreshSupplierDetail(supplierDetail);
    const existing = resolveWorkshopOrder(freshDetail, 'sewingOrder');
    const payload = buildSewOrderPayload({
      existing,
      records: nextRecords,
      productionOrder: toWorkshopProductionRef(freshDetail),
    });

    await persistWorkshopOrder({
      detail: freshDetail,
      existing,
      payload,
      service: sewOrderService,
      key: 'sewingOrder',
    });

    return receivingSewingService.getSewingRecords(productionColorId);
  },
};
