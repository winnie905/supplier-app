/**
 * 生产色标识。
 *
 * BFF 的搜索接口只返回 productionOrderCode + color，不返回生产色数字 id，
 * 因此 App 内部统一用「生产单号::颜色」作为生产色 id，
 * 数字 id 仅在详情返回后用于 mutation 入参。
 */

const SEPARATOR = '::';

export interface ProductionColorRef {
  productionOrderCode: string;
  color: string;
}

export const encodeProductionColorId = ({ productionOrderCode, color }: ProductionColorRef) =>
  `${productionOrderCode}${SEPARATOR}${color}`;

export const decodeProductionColorId = (id: string): ProductionColorRef | null => {
  const index = id.indexOf(SEPARATOR);
  if (index <= 0) return null;

  const productionOrderCode = id.slice(0, index);
  const color = id.slice(index + SEPARATOR.length);
  if (!productionOrderCode || !color) return null;

  return { productionOrderCode, color };
};
