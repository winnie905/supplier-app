import type { SizeRange } from '@/types/productionOrder';
import type { SizeQuantity } from '@/types/receiving';

export const emptySizeQuantities = (sizes: string[]): SizeQuantity[] =>
  sizes.map((size) => ({ size, quantity: 0 }));

export const sumQuantities = (items: SizeQuantity[]) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0);

/** 接口可能返回重复码数；渲染以码数为 key，必须去重 */
export const uniqueSizeNames = (names: string[]): string[] => [...new Set(names)];

export const sizeNamesFromRange = (sizeRange: SizeRange[]): string[] =>
  uniqueSizeNames(sizeRange.map((item) => item.name));
