export const RECEIVING_STORAGE_KEY = '@supplier/receiving/state';

/** action 入口面板背景色，首页底部区域与之保持一致 */
export const RECEIVING_ACTION_PANEL_BG = '#F2F3F6';

export const MATERIAL_EXCEPTION_TYPES = ['缺料', '质量问题'] as const;

export const CUTTING_EXCEPTION_TYPES = [
  '唛架数不足',
  '唛架数超出',
  '裁数不足',
  '裁数超出',
] as const;

export const MODULE_LABELS = {
  material: '物料齐套',
  cutting: '裁床',
} as const;

export const ACTION_ENTRIES = [
  { key: 'material', title: '物料齐套确认' },
  { key: 'cutting', title: '裁床' },
  { key: 'sewing', title: '车位' },
  { key: 'packing', title: '尾部装箱' },
] as const;

export type ActionEntryKey = (typeof ACTION_ENTRIES)[number]['key'];
