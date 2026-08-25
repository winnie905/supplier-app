import { uniqueSizeNames } from '@/services/receiving/sizeQuantity';
import type { CropProcess, CropProcessSizeRange } from '@/types/cropOrder';
import type { SizeQuantity } from '@/types/receiving';

/** CropProcess.sizeRange → 尺码数量列表（裁床/车缝/尾部共用） */
export const toSizeQuantities = (process: CropProcess): SizeQuantity[] =>
  (process.sizeRange ?? []).map((item) => ({
    size: item.name,
    quantity: item.cropQuantity ?? 0,
  }));

/** 尺码数量列表 → CropProcess.sizeRange（写入方向） */
export const toCropSizeRange = (values: SizeQuantity[]): CropProcessSizeRange[] =>
  values.map((item) => ({
    name: item.size,
    cropQuantity: item.quantity,
  }));

export const sumCropQuantity = (sizeRange: CropProcessSizeRange[]): number =>
  sizeRange.reduce((sum, item) => sum + (item.cropQuantity ?? 0), 0);

export const sumProcessQuantity = (processes: CropProcess[]): number =>
  processes.reduce((sum, item) => sum + (item.totalQuantity ?? 0), 0);

/** 页面本地新建记录 id（`local-` 前缀），提交后端时不携带 */
export const isLocalRecordId = (id: string) => id.startsWith('local-');

/**
 * 计划码数：优先生产单尺码表，再按传入顺序回退到已有记录的码数。
 * 与 `a ?? b ?? []` 语义一致，仅在候选为 null/undefined 时继续回退。
 */
export const planSizeNames = (...candidates: (string[] | undefined)[]): string[] =>
  uniqueSizeNames(candidates.find((names) => names != null) ?? []);
