export const RECEIVING_STORAGE_KEY = '@supplier/receiving/state';

/** action 入口面板背景色，首页底部区域与之保持一致 */
export const RECEIVING_ACTION_PANEL_BG = '#F2F3F6';

export const INVALID_PRODUCTION_QR_MODAL = {
  title: '未识别到有效二维码',
  message: '请确认二维码是否正确',
} as const;

/** 提交空表单时的统一提示 */
export const EMPTY_FORM_SUBMIT_MESSAGE = '不能提交空白表单！';

export const MATERIAL_EXCEPTION_TYPES = ['缺料', '质量问题'] as const;

export const CUTTING_EXCEPTION_TYPES = [
  '唛架数不足',
  '唛架数超出',
  '裁数不足',
  '裁数超出',
] as const;

/** 物料齐套-包装辅料：前端固定清单（不依赖后端返回项） */
export const FIXED_PACKAGING_MATERIALS = [
  { id: 'pack-carton', name: '纸箱' },
  { id: 'pack-bag', name: '包装袋' },
  { id: 'pack-hangtag', name: '吊牌' },
  { id: 'pack-labels', name: '主唛、码唛、洗水唛' },
  { id: 'pack-sticker', name: '贴纸' },
] as const;

/** 物料齐套-资料包：前端固定清单（不依赖后端返回项） */
export const FIXED_DATA_PACKAGE_MATERIALS = [
  { id: 'pkg-requirements', name: '做货要求' },
  { id: 'pkg-size-chart', name: '尺寸表' },
  { id: 'pkg-pattern', name: '纸样' },
  { id: 'pkg-tech-pack', name: '工艺单' },
  { id: 'pkg-sample', name: '样衣' },
] as const;

/** 异常上报/回复记录中的模块展示名（与 web 异常模块一致） */
export const EXCEPTION_MODULE_LABELS = {
  material: '物料齐备',
  cutting: '裁床',
} as const;

export const ACTION_ENTRIES = [
  { key: 'material', title: '物料齐套确认' },
  { key: 'cutting', title: '裁床' },
  { key: 'sewing', title: '车位' },
  { key: 'packing', title: '尾部装箱' },
] as const;

export type ActionEntryKey = (typeof ACTION_ENTRIES)[number]['key'];
