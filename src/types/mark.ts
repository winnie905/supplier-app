export interface NormalizedMarkRect {
  normalizedHeight: number;
  normalizedWidth: number;
  normalizedX: number;
  normalizedY: number;
}

export interface NormalizedRect {
  nh: number;
  nw: number;
  nx: number;
  ny: number;
}

export type Corner = 'ne' | 'nw' | 'se' | 'sw';

export interface DisplaySize {
  height: number;
  width: number;
}

export interface ContainLayout extends DisplaySize {
  offX: number;
  offY: number;
}

export const MIN_N = 0.06;
export const MIN_DRAW_N = 0.01;
export const HANDLE = 28;

export const EMPTY_RECT: NormalizedRect = {
  nh: 0,
  nw: 0,
  nx: 0,
  ny: 0,
};
