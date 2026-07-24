import type { CropProcess } from '@/types/cropOrder';
import type { SizeQuantity } from '@/types/receiving';

/** CropProcess.sizeRange → 尺码数量列表（裁床/车缝/尾部共用） */
export const toSizeQuantities = (process: CropProcess): SizeQuantity[] =>
  (process.sizeRange ?? []).map((item) => ({
    size: item.name,
    quantity: item.cropQuantity ?? 0,
  }));
