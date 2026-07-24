import { toSizeQuantities } from '@/services/apps/mapWorkshopSizes';
import type { CropProcess, TailOrder, WorkshopProductionOrderRef } from '@/types/cropOrder';
import type { PackingBoxRecord, PackingRecordsData } from '@/types/receiving';

/** 优先 tailOrderStorage，兼容仅写在 cropOrderStorage 的历史数据 */
const getTailProcesses = (order: TailOrder): CropProcess[] => {
  const fromTail = order.tailOrderStorage?.cropProcesses;
  if (fromTail?.length) return fromTail;
  return order.cropOrderStorage?.cropProcesses ?? [];
};

/**
 * TailOrder → 装箱记录页 UI 结构。
 * boxNo 为客户端序号（接口无该字段），按 cropDate 升序后从 1 编号。
 */
export const mapTailOrderToPackingRecords = (
  order: TailOrder,
  productionColorId: string,
): PackingRecordsData => {
  const processes = [...getTailProcesses(order)].sort((a, b) =>
    (a.cropDate ?? '').localeCompare(b.cropDate ?? ''),
  );

  const boxes: PackingBoxRecord[] = processes.map((process, index) => ({
    id: process.id,
    boxNo: index + 1,
    ...(process.boxSpecification?.id ? { cartonSpecId: process.boxSpecification.id } : {}),
    weightKg: process.boxWeight ?? 0,
    sizeQuantities: toSizeQuantities(process),
    submitted: Boolean(process.cropDate),
    ...(process.cropDate ? { submittedAt: process.cropDate } : {}),
  }));

  const planSizes =
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ??
    boxes[0]?.sizeQuantities.map((item) => item.size) ??
    [];

  return {
    productionColorId,
    boxes,
    sizes: planSizes,
  };
};

/** PackingBoxRecord → CropProcess（提交/更新尾部单装箱时用） */
export const mapPackingBoxToCropProcess = (box: PackingBoxRecord): CropProcess => {
  const sizeRange = box.sizeQuantities.map((item) => ({
    name: item.size,
    cropQuantity: item.quantity,
  }));
  const totalQuantity = sizeRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);

  return {
    id: box.id,
    ...(box.submittedAt ? { cropDate: box.submittedAt } : {}),
    type: 'machine',
    sizeRange,
    totalQuantity,
    boxWeight: box.weightKg,
    ...(box.cartonSpecId
      ? {
          boxSpecification: {
            id: box.cartonSpecId,
          },
        }
      : {}),
  };
};

/** 由已提交箱子组装尾部单写入体 */
export const buildTailOrderPayload = (params: {
  existing: TailOrder | null;
  orderId: number;
  boxes: PackingBoxRecord[];
  productionOrder?: WorkshopProductionOrderRef;
}): TailOrder => {
  const submitted = [...params.boxes]
    .filter((box) => box.submitted)
    .sort((a, b) => a.boxNo - b.boxNo);
  const processes = submitted.map(mapPackingBoxToCropProcess);

  return {
    id: params.existing?.id && params.existing.id > 0 ? params.existing.id : params.orderId,
    status: params.existing?.status ?? 'InProgress',
    cropOrderType: 'TAIL_ORDER',
    ...((params.existing?.productionOrder ?? params.productionOrder)
      ? { productionOrder: params.existing?.productionOrder ?? params.productionOrder }
      : {}),
    cropOrderStorage: { cropProcesses: [] },
    tailOrderStorage: { cropProcesses: processes },
  };
};
