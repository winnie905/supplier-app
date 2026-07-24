import { toSizeQuantities } from '@/services/apps/mapWorkshopSizes';
import type { CropOrder, CropProcess, WorkshopProductionOrderRef } from '@/types/cropOrder';
import type { CuttingBedRecord, CuttingRecordsData } from '@/types/receiving';

/**
 * CropOrder → 裁床记录页 UI 结构。
 * bedNo 为客户端序号（接口无该字段），按 cropDate 升序后从 1 编号。
 */
export const mapCropOrderToCuttingRecords = (
  order: CropOrder,
  productionColorId: string,
): CuttingRecordsData => {
  const processes = [...(order.cropOrderStorage?.cropProcesses ?? [])].sort((a, b) =>
    (a.cropDate ?? '').localeCompare(b.cropDate ?? ''),
  );

  const beds: CuttingBedRecord[] = processes.map((process, index) => ({
    id: process.id,
    bedNo: index + 1,
    bundleCount: process.parameter ?? 0,
    sizeQuantities: toSizeQuantities(process),
    submitted: Boolean(process.cropDate),
    ...(process.cropDate ? { submittedAt: process.cropDate } : {}),
  }));

  const planSizes =
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ??
    beds[0]?.sizeQuantities.map((item) => item.size) ??
    [];

  return {
    productionColorId,
    beds,
    quantity: order.productionOrder?.customerPurchaseOrder?.quantity ?? 0,
    sizes: planSizes,
  };
};

/** CuttingBedRecord → CropProcess（提交/更新裁床单时用） */
export const mapCuttingBedToCropProcess = (bed: CuttingBedRecord): CropProcess => {
  const sizeRange = bed.sizeQuantities.map((item) => ({
    name: item.size,
    cropQuantity: item.quantity,
  }));
  const totalQuantity = sizeRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);

  return {
    id: bed.id,
    ...(bed.submittedAt ? { cropDate: bed.submittedAt } : {}),
    type: 'machine',
    parameter: bed.bundleCount,
    sizeRange,
    totalQuantity,
  };
};

/** 由已提交床次组装裁床单写入体（create / update） */
export const buildCropOrderPayload = (params: {
  existing: CropOrder | null;
  orderId: number;
  beds: CuttingBedRecord[];
  productionOrder?: WorkshopProductionOrderRef;
}): CropOrder => {
  const submitted = [...params.beds]
    .filter((bed) => bed.submitted)
    .sort((a, b) => a.bedNo - b.bedNo);

  return {
    id: params.existing?.id && params.existing.id > 0 ? params.existing.id : params.orderId,
    status: params.existing?.status ?? 'InProgress',
    cropOrderType: 'CROP_ORDER',
    ...((params.existing?.productionOrder ?? params.productionOrder)
      ? { productionOrder: params.existing?.productionOrder ?? params.productionOrder }
      : {}),
    cropOrderStorage: {
      cropProcesses: submitted.map(mapCuttingBedToCropProcess),
    },
  };
};
