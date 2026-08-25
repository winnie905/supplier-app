import {
  isLocalRecordId,
  planSizeNames,
  sumCropQuantity,
  sumProcessQuantity,
  toCropSizeRange,
  toSizeQuantities,
} from '@/services/apps/mapWorkshopSizes';
import type {
  CropProcess,
  CropProcessType,
  TailOrder,
  WorkshopProductionOrderRef,
} from '@/types/cropOrder';
import type { CartonSpecType, PackingBoxRecord, PackingRecordsData } from '@/types/receiving';

/** 优先 tailOrderStorage，兼容仅写在 cropOrderStorage 的历史数据 */
const getTailProcesses = (order: TailOrder): CropProcess[] => {
  const fromTail = order.tailOrderStorage?.cropProcesses;
  if (fromTail?.length) return fromTail;
  return order.cropOrderStorage?.cropProcesses ?? [];
};

const mapBoxSpecTypeToCarton = (type?: string): CartonSpecType | undefined => {
  if (type === 'General' || type === 'general') return 'general';
  if (type === 'Brand' || type === 'brand') return 'brand';
  return undefined;
};

const processTypeForCarton = (cartonType?: CartonSpecType): CropProcessType =>
  cartonType === 'brand' ? 'BrandBox' : 'CommonBox';

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

  const boxes: PackingBoxRecord[] = processes.map((process, index) => {
    const boxSpec = process.boxSpecification;
    const cartonSpecType =
      mapBoxSpecTypeToCarton(boxSpec?.type) ??
      (process.type === 'BrandBox'
        ? 'brand'
        : process.type === 'CommonBox'
          ? 'general'
          : undefined);

    return {
      id: process.id ?? `local-${index}-${process.cropDate ?? 'new'}`,
      boxNo: index + 1,
      ...(boxSpec?.id ? { cartonSpecId: boxSpec.id } : {}),
      ...(cartonSpecType ? { cartonSpecType } : {}),
      ...(boxSpec?.name != null ? { cartonSpecName: boxSpec.name } : {}),
      ...(boxSpec?.unit != null ? { cartonSpecUnit: boxSpec.unit } : {}),
      ...(boxSpec?.length != null ? { cartonSpecLength: boxSpec.length } : {}),
      ...(boxSpec?.width != null ? { cartonSpecWidth: boxSpec.width } : {}),
      ...(boxSpec?.height != null ? { cartonSpecHeight: boxSpec.height } : {}),
      weightKg: process.boxWeight ?? 0,
      sizeQuantities: toSizeQuantities(process),
      submitted: Boolean(process.cropDate),
      ...(process.cropDate ? { submittedAt: process.cropDate } : {}),
    };
  });

  const planSizes = planSizeNames(
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name),
    boxes[0]?.sizeQuantities.map((item) => item.size),
  );

  return {
    productionColorId,
    boxes,
    sizes: planSizes,
  };
};

/** PackingBoxRecord → CropProcess（提交/更新尾部单装箱时用） */
export const mapPackingBoxToCropProcess = (box: PackingBoxRecord): CropProcess => {
  const sizeRange = toCropSizeRange(box.sizeQuantities);
  const totalQuantity = sumCropQuantity(sizeRange);

  return {
    ...(isLocalRecordId(box.id) ? {} : { id: box.id }),
    ...(box.submittedAt ? { cropDate: box.submittedAt } : {}),
    type: processTypeForCarton(box.cartonSpecType),
    sizeRange,
    totalQuantity,
    boxWeight: box.weightKg,
    ...(box.cartonSpecId
      ? {
          boxSpecification: {
            id: box.cartonSpecId,
            name: box.cartonSpecName ?? '',
            unit: box.cartonSpecUnit ?? '',
            ...(box.cartonSpecLength != null ? { length: box.cartonSpecLength } : {}),
            ...(box.cartonSpecWidth != null ? { width: box.cartonSpecWidth } : {}),
            ...(box.cartonSpecHeight != null ? { height: box.cartonSpecHeight } : {}),
            ...(box.cartonSpecType === 'brand'
              ? { type: 'Brand' as const }
              : box.cartonSpecType === 'general'
                ? { type: 'General' as const }
                : {}),
          },
        }
      : {}),
  };
};

/**
 * 由已提交箱子组装尾部单写入体（create / update）。
 * create 不传 id；update 只用生产单详情关联的 tailOrder.id。
 * 入参类型 ErpCropOrderDtoInput 没有 tailOrderStorage，装箱工序只能写 cropOrderStorage。
 */
export const buildTailOrderPayload = (params: {
  existing: TailOrder | null;
  boxes: PackingBoxRecord[];
  productionOrder?: WorkshopProductionOrderRef;
}): TailOrder => {
  const submitted = [...params.boxes]
    .filter((box) => box.submitted)
    .sort((a, b) => a.boxNo - b.boxNo);
  const processes = submitted.map(mapPackingBoxToCropProcess);
  const cropTotal = sumProcessQuantity(processes);
  const productionOrder = params.productionOrder ?? params.existing?.productionOrder;
  const tailOrderId = params.existing?.id;

  return {
    ...(tailOrderId != null && tailOrderId > 0 ? { id: tailOrderId } : {}),
    status: params.existing?.status ?? 'Pending',
    cropOrderType: 'TailOrder',
    ...(productionOrder ? { productionOrder } : {}),
    cropOrderStorage: { cropProcesses: processes, cropTotal },
  };
};
