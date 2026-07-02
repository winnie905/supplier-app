/**
 * 存放图片标注交互相关的矩形运算：归一化框边界约束、
 * 草稿/提交态裁剪、由手势起止点生成矩形等。
 */
import type { NormalizedRect } from '@/types/mark';
import { EMPTY_RECT, MIN_N } from '@/types/mark';

/** 判断当前是否没有有效框 */
export const isEmptyRect = (r: NormalizedRect): boolean => r.nw <= 0 || r.nh <= 0;

/**
 * 已有有效框时使用。
 * 会强制宽高不低于最小值。
 */
export const clampRect = (r: NormalizedRect): NormalizedRect => {
  let { nh, nw, nx, ny } = r;

  nw = Math.max(MIN_N, Math.min(nw, 1));
  nh = Math.max(MIN_N, Math.min(nh, 1));
  nx = Math.max(0, Math.min(nx, 1 - nw));
  ny = Math.max(0, Math.min(ny, 1 - nh));

  return { nh, nw, nx, ny };
};

/**
 * 首次绘制时使用。
 * 宽高允许为 0，这样按下的一瞬间不会被强行撑成最小框。
 */
export const clampDraftRect = (r: NormalizedRect): NormalizedRect => {
  let { nh, nw, nx, ny } = r;

  nx = Math.max(0, Math.min(nx, 1));
  ny = Math.max(0, Math.min(ny, 1));
  nw = Math.max(0, Math.min(nw, 1 - nx));
  nh = Math.max(0, Math.min(nh, 1 - ny));

  return { nh, nw, nx, ny };
};

/** 外部传入的 rect 统一归一化 */
export const normalizeIncomingRect = (rect: NormalizedRect): NormalizedRect => {
  return isEmptyRect(rect) ? EMPTY_RECT : clampRect(rect);
};

/**
 * 根据“起点 + 终点”生成矩形。
 * 支持四个方向任意拖动。
 */
export const createRectFromPoints = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): NormalizedRect => {
  return {
    nx: Math.min(startX, endX),
    ny: Math.min(startY, endY),
    nw: Math.abs(endX - startX),
    nh: Math.abs(endY - startY),
  };
};
