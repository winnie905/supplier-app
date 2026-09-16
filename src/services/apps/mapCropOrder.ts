import {
  type CropProcessSubmitAudit,
  findCropProcessById,
  isLocalRecordId,
  planSizeNames,
  sumCropQuantity,
  sumProcessQuantity,
  toCropSizeRange,
  toSizeQuantities,
  withCropProcessAudit,
} from '@/services/apps/mapWorkshopSizes';
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
    // 无后端 id 时给本地稳定 key，提交时不会回传给接口
    id: process.id ?? `local-${index}-${process.cropDate ?? 'new'}`,
    bedNo: index + 1,
    bundleCount: process.parameter ?? 0,
    sizeQuantities: toSizeQuantities(process),
    submitted: Boolean(process.cropDate),
    ...(process.cropDate ? { submittedAt: process.cropDate } : {}),
  }));

  const planSizes = planSizeNames(
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name),
    beds[0]?.sizeQuantities.map((item) => item.size),
  );

  return {
    productionColorId,
    beds,
    quantity: order.productionOrder?.customerPurchaseOrder?.quantity ?? 0,
    sizes: planSizes,
  };
};

/** CuttingBedRecord → CropProcess（提交/更新裁床单时用） */
export const mapCuttingBedToCropProcess = (bed: CuttingBedRecord): CropProcess => {
  const sizeRange = toCropSizeRange(bed.sizeQuantities);
  const totalQuantity = sumCropQuantity(sizeRange);

  return {
    ...(isLocalRecordId(bed.id) ? {} : { id: bed.id }),
    ...(bed.submittedAt ? { cropDate: bed.submittedAt } : {}),
    type: 'Machine',
    parameter: bed.bundleCount ?? 0,
    sizeRange,
    totalQuantity,
  };
};

/**
 * 由已提交床次组装裁床单写入体（create / update）。
 * productionOrder 优先用已有裁床单上的，其次用本次传入的生产单摘要。
 * create 不传 id（由后端生成）；update 只用已有裁床单 id，绝不用生产单 id。
 */
export const buildCropOrderPayload = (params: {
  existing: CropOrder | null;
  beds: CuttingBedRecord[];
  productionOrder?: WorkshopProductionOrderRef;
  audit: CropProcessSubmitAudit;
}): CropOrder => {
  const submitted = [...params.beds]
    .filter((bed) => bed.submitted)
    .sort((a, b) => a.bedNo - b.bedNo);
  const existingProcesses = params.existing?.cropOrderStorage?.cropProcesses;
  const cropProcesses = submitted.map((bed) => {
    const existingProcess = findCropProcessById(
      existingProcesses,
      isLocalRecordId(bed.id) ? undefined : bed.id,
    );
    return withCropProcessAudit(mapCuttingBedToCropProcess(bed), {
      stamp: params.audit.targetIds.includes(bed.id),
      audit: params.audit,
      ...(existingProcess ? { existing: existingProcess } : {}),
    });
  });
  const cropTotal = sumProcessQuantity(cropProcesses);
  // 优先用本次从生产单详情组装的入参（含 schema 必填占位）；已有裁床单回传作兜底
  const productionOrder = params.productionOrder ?? params.existing?.productionOrder;
  const cropOrderId = params.existing?.id;

  return {
    ...(cropOrderId != null && cropOrderId > 0 ? { id: cropOrderId } : {}),
    status: params.existing?.status ?? 'Pending',
    cropOrderType: 'CropOrder',
    ...(productionOrder ? { productionOrder } : {}),
    cropOrderStorage: {
      cropProcesses,
      cropTotal,
    },
  };
};
