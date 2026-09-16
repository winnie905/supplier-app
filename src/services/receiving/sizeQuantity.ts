import type { SizeRange } from '@/types/productionOrder';
import type { SizeQuantity } from '@/types/receiving';

export const emptySizeQuantities = (sizes: string[], quantity: number | null = 0): SizeQuantity[] =>
  sizes.map((size) => ({ size, quantity }));

export const sumQuantities = (items: SizeQuantity[]) =>
  items.reduce((total, item) => total + (item.quantity ?? 0), 0);

/** 全部尺码都未填写（空着，不是用户输入的 0） */
export const isBlankSizeQuantities = (items: SizeQuantity[]) =>
  items.every((item) => item.quantity == null);

export const fillUnfilledSizeQuantities = (items: SizeQuantity[]): SizeQuantity[] =>
  items.map((item) => ({ ...item, quantity: item.quantity ?? 0 }));

/** 接口可能返回重复码数；渲染以码数为 key，必须去重 */
export const uniqueSizeNames = (names: string[]): string[] => [...new Set(names)];

export const sizeNamesFromRange = (sizeRange: SizeRange[]): string[] =>
  uniqueSizeNames(sizeRange.map((item) => item.name));
