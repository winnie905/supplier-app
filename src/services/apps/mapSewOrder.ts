import { toSizeQuantities } from '@/services/apps/mapWorkshopSizes';
import type { CropProcess, SewOrder } from '@/types/cropOrder';
import type { SewingDayRecord, SewingRecordsData, SizeQuantity } from '@/types/receiving';

const fromSizeQuantities = (values: SizeQuantity[]) =>
  values.map((item) => ({
    name: item.size,
    cropQuantity: item.quantity,
  }));

const dateKeyFromIso = (iso?: string): string => {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

/**
 * SewOrder → 车位记录。
 * 约定：process.type = 'up' | 'down'；旧 mock 的 machine 视为下数。
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
    if (process.type === 'up') {
      bucket.up = process;
    } else {
      // down / machine / 其它 → 下数
      bucket.down = process;
    }
    byDate.set(key, bucket);
  }

  const records: SewingDayRecord[] = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, bucket]) => {
      const down = bucket.down;
      const up = bucket.up;
      const id = down?.id?.replace(/-down$/, '') ?? up?.id?.replace(/-up$/, '') ?? `sew-${date}`;
      const submittedAt = down?.cropDate ?? up?.cropDate;
      return {
        id,
        date,
        upQuantities: up ? toSizeQuantities(up) : [],
        downQuantities: down ? toSizeQuantities(down) : [],
        submitted: Boolean(submittedAt),
        ...(submittedAt ? { submittedAt } : {}),
      };
    });

  const planSizes =
    order.productionOrder?.customerPurchaseOrder?.sizeRange?.map((item) => item.name) ??
    records[0]?.downQuantities.map((item) => item.size) ??
    records[0]?.upQuantities.map((item) => item.size) ??
    [];

  return {
    productionColorId,
    records,
    sizes: planSizes,
    today,
  };
};

/** SewingDayRecord → 上/下数两条 CropProcess */
export const mapSewingDayToCropProcesses = (record: SewingDayRecord): CropProcess[] => {
  const cropDate = record.submittedAt ?? `${record.date}T12:00:00.000Z`;
  const processes: CropProcess[] = [];

  const upRange = fromSizeQuantities(record.upQuantities);
  const upTotal = upRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);
  if (upTotal > 0 || record.upQuantities.length > 0) {
    processes.push({
      id: `${record.id}-up`,
      cropDate,
      type: 'up',
      sizeRange: upRange,
      totalQuantity: upTotal,
    });
  }

  const downRange = fromSizeQuantities(record.downQuantities);
  const downTotal = downRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);
  processes.push({
    id: `${record.id}-down`,
    cropDate,
    type: 'down',
    sizeRange: downRange,
    totalQuantity: downTotal,
  });

  return processes;
};
