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
import type { CropProcess, SewOrder, WorkshopProductionOrderRef } from '@/types/cropOrder';
import type { SewingDayRecord, SewingRecordsData } from '@/types/receiving';

const dateKeyFromIso = (iso?: string): string => {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const isUpSew = (type?: string) => type === 'UpSew' || type === 'up';
const isDownSew = (type?: string) =>
  type === 'DownSew' || type === 'down' || type === 'Machine' || type === 'machine';

/**
 * SewOrder → 车位记录。
 * 约定：process.type = UpSew（上数）/ DownSew（下数）。
 */
export const mapSewOrderToSewingRecords = (
  order: SewOrder,
  productionColorId: string,
  today: string,
): SewingRecordsData => {
  const processes = order.cropOrderStorage?.cropProcesses ?? [];
  const byDate = new Map<string, { up?: CropProcess; down?: CropProcess }>();

  for (const process of processes) {
    const key = dateKeyFromIso(process.cropDate);
    if (!key) continue;
    const bucket = byDate.get(key) ?? {};
    if (isUpSew(process.type)) {
      bucket.up = process;
    } else if (isDownSew(process.type) || !bucket.down) {
      // DownSew；无法识别类型时兜底进下数，避免丢数据
      bucket.down = process;
    }
    byDate.set(key, bucket);
  }

  const records: SewingDayRecord[] = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, bucket]) => {
      const down = bucket.down;
      const up = bucket.up;
      const submittedAt = down?.cropDate ?? up?.cropDate;
      return {
        id: down?.id ?? up?.id ?? `local-${date}`,
        date,
        upQuantities: up ? toSizeQuantities(up) : [],
        downQuantities: down ? toSizeQuantities(down) : [],
        submitted: Boolean(submittedAt),
        ...(submittedAt ? { submittedAt } : {}),
        ...(up?.id ? { upProcessId: up.id } : {}),
        ...(down?.id ? { downProcessId: down.id } : {}),
      };
    });

  const planSizes = planSizeNames(
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name),
    records[0]?.downQuantities.map((item) => item.size),
    records[0]?.upQuantities.map((item) => item.size),
  );

  return {
    productionColorId,
    records,
    sizes: planSizes,
    today,
  };
};

/** SewingDayRecord → 上/下数两条 CropProcess（提交/更新车缝单时用） */
export const mapSewingDayToCropProcesses = (record: SewingDayRecord): CropProcess[] => {
  const cropDate = record.submittedAt ?? `${record.date}T12:00:00.000Z`;
  const processes: CropProcess[] = [];

  const upRange = toCropSizeRange(record.upQuantities);
  const upTotal = sumCropQuantity(upRange);
  if (upTotal > 0 || record.upQuantities.some((item) => item.quantity > 0)) {
    processes.push({
      ...(record.upProcessId && !isLocalRecordId(record.upProcessId)
        ? { id: record.upProcessId }
        : {}),
      cropDate,
      type: 'UpSew',
      sizeRange: upRange,
      totalQuantity: upTotal,
    });
  }

  const downRange = toCropSizeRange(record.downQuantities);
  const downTotal = sumCropQuantity(downRange);
  // 下车位允许 0 件提交时仍写一条，便于按日对齐；完全空表由上层 EMPTY_FORM 拦截
  processes.push({
    ...(record.downProcessId && !isLocalRecordId(record.downProcessId)
      ? { id: record.downProcessId }
      : {}),
    cropDate,
    type: 'DownSew',
    sizeRange: downRange,
    totalQuantity: downTotal,
  });

  return processes;
};

/**
 * 由已提交日记录组装车缝单写入体（create / update）。
 * create 不传 id；update 只用生产单详情关联的 sewingOrder.id。
 */
export const buildSewOrderPayload = (params: {
  existing: SewOrder | null;
  records: SewingDayRecord[];
  productionOrder?: WorkshopProductionOrderRef;
  audit: CropProcessSubmitAudit;
}): SewOrder => {
  const submitted = [...params.records]
    .filter((record) => record.submitted)
    .sort((a, b) => a.date.localeCompare(b.date));
  const existingProcesses = params.existing?.cropOrderStorage?.cropProcesses;
  const cropProcesses = submitted.flatMap((record) => {
    const stamp = params.audit.targetIds.includes(record.id);
    return mapSewingDayToCropProcesses(record).map((process) => {
      const existingProcess = findCropProcessById(existingProcesses, process.id);
      return withCropProcessAudit(process, {
        stamp,
        audit: params.audit,
        ...(existingProcess ? { existing: existingProcess } : {}),
      });
    });
  });
  const cropTotal = sumProcessQuantity(cropProcesses);
  const productionOrder = params.productionOrder ?? params.existing?.productionOrder;
  const sewOrderId = params.existing?.id;

  return {
    ...(sewOrderId != null && sewOrderId > 0 ? { id: sewOrderId } : {}),
    status: params.existing?.status ?? 'Pending',
    cropOrderType: 'SewingOrder',
    ...(productionOrder ? { productionOrder } : {}),
    cropOrderStorage: {
      cropProcesses,
      cropTotal,
    },
  };
};
