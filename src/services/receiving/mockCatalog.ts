import type {
  CartonSpec,
  MaterialItem,
  ProductionColorDetail,
  ProductionColorSummary,
} from '@/types/receiving';

const MOCK_IMAGE_URL =
  'https://img0.baidu.com/it/u=1414190783,2671516514&fm=253&app=138&f=JPEG?w=800&h=1200';

const mockImageUrls = (count = 1): string[] => Array.from({ length: count }, () => MOCK_IMAGE_URL);

export const MOCK_CARTON_SPECS: CartonSpec[] = [
  {
    id: 'carton-large',
    name: '大箱',
    length: 52,
    width: 34,
    height: 38,
    type: 'brand',
    tag: '最常用',
  },
  {
    id: 'carton-medium',
    name: '中箱',
    length: 45,
    width: 30,
    height: 32,
    type: 'general',
    tag: '常用',
  },
  { id: 'carton-small', name: '小箱', length: 38, width: 26, height: 24, type: 'general' },
];

const defaultModuleStatus = {
  material: 'pending' as const,
  cutting: { cutTotal: 0, hasException: false },
  sewing: { upTotal: 0, downTotal: 0 },
  packing: { boxCount: 0, pieceCount: 0 },
};

const baseDetail = (
  partial: Partial<ProductionColorDetail> &
    Pick<ProductionColorDetail, 'id' | 'productionOrderNo' | 'color'>,
): ProductionColorDetail => ({
  bulkStyleNo: 'SDG12345',
  po: '230101',
  brand: 'SUPERDOWN',
  colorCode: 'BK-01',
  thumbnailUrl: MOCK_IMAGE_URL,
  imageUrls: mockImageUrls(),
  status: 'active',
  moduleStatus: { ...defaultModuleStatus },
  styleCategory: '连衣裙',
  requiredDeliveryDate: '2024/06/30',
  designNo: 'DN-2024-088',
  customerStyleNo: 'CUS-7788',
  orderType: 'FOB',
  processingMethod: '包工包料',
  merchandiser: '王小美',
  plannedTotal: 500,
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  ...partial,
});

export const MOCK_PRODUCTION_COLORS: ProductionColorDetail[] = [
  baseDetail({
    id: 'pc-empty',
    productionOrderNo: 'DS-2026-001',
    color: '白色',
    bulkStyleNo: 'SDG10001',
    po: '240001',
    brand: 'APEX',
    moduleStatus: { ...defaultModuleStatus },
  }),
  baseDetail({
    id: 'pc-partial-material',
    productionOrderNo: 'DS-2026-031',
    color: '黄色',
    bulkStyleNo: 'SDQ10070-F26',
    brand: 'SUPERDOWN',
    po: 'SUPERDOWN',
    styleCategory: '连衣裙 DS',
    requiredDeliveryDate: '2027-01-10',
    imageUrls: mockImageUrls(6),
    moduleStatus: {
      material: 'exception',
      cutting: { cutTotal: 105, hasException: true },
      sewing: { upTotal: 200, downTotal: 0 },
      packing: { boxCount: 18, pieceCount: 77 },
    },
  }),
  baseDetail({
    id: 'pc-all-material',
    productionOrderNo: 'DS-2026-042',
    color: '藏青',
    bulkStyleNo: 'SDG22334',
    po: '240088',
    brand: 'MODA',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 120, hasException: false },
      sewing: { upTotal: 80, downTotal: 60 },
      packing: { boxCount: 2, pieceCount: 80 },
    },
  }),
  baseDetail({
    id: 'pc-material-exception-pending',
    productionOrderNo: 'DS-2026-055',
    color: '红色',
    bulkStyleNo: 'SDG33445',
    brand: 'LUXE',
    moduleStatus: {
      material: 'exception',
      cutting: { cutTotal: 0, hasException: false },
      sewing: { upTotal: 0, downTotal: 0 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-material-exception-replied',
    productionOrderNo: 'DS-2026-066',
    color: '米色',
    bulkStyleNo: 'SDG44556',
    brand: 'CHIC',
    moduleStatus: {
      material: 'exception',
      cutting: { cutTotal: 50, hasException: false },
      sewing: { upTotal: 0, downTotal: 0 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-cutting',
    productionOrderNo: 'DS-2026-077',
    color: '灰色',
    bulkStyleNo: 'SDG55667',
    brand: 'URBAN',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 180, hasException: false },
      sewing: { upTotal: 0, downTotal: 0 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-cutting-exception',
    productionOrderNo: 'DS-2026-088',
    color: '卡其',
    bulkStyleNo: 'SDG66778',
    brand: 'FIELD',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 90, hasException: true },
      sewing: { upTotal: 0, downTotal: 0 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-sewing-today',
    productionOrderNo: 'DS-2026-099',
    color: '粉色',
    bulkStyleNo: 'SDG77889',
    brand: 'SOFT',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 200, hasException: false },
      sewing: { upTotal: 120, downTotal: 80 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-sewing-history',
    productionOrderNo: 'DS-2026-110',
    color: '蓝色',
    bulkStyleNo: 'SDG88990',
    brand: 'OCEAN',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 300, hasException: false },
      sewing: { upTotal: 250, downTotal: 200 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-packing',
    productionOrderNo: 'DS-2026-121',
    color: '绿色',
    bulkStyleNo: 'SDG99001',
    brand: 'NATURE',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 400, hasException: false },
      sewing: { upTotal: 380, downTotal: 360 },
      packing: { boxCount: 5, pieceCount: 360 },
    },
  }),
  baseDetail({
    id: 'pc-multi-image',
    productionOrderNo: 'DS-2026-132',
    color: '格纹',
    bulkStyleNo: 'SDG10112',
    brand: 'PLAID',
    imageUrls: mockImageUrls(5),
    moduleStatus: {
      material: 'partial',
      cutting: { cutTotal: 0, hasException: false },
      sewing: { upTotal: 0, downTotal: 0 },
      packing: { boxCount: 0, pieceCount: 0 },
    },
  }),
  baseDetail({
    id: 'pc-completed',
    productionOrderNo: 'DS-2025-999',
    color: '黑色',
    bulkStyleNo: 'SDG99999',
    brand: 'DONE',
    status: 'completed',
    moduleStatus: {
      material: 'all_arrived',
      cutting: { cutTotal: 500, hasException: false },
      sewing: { upTotal: 500, downTotal: 500 },
      packing: { boxCount: 10, pieceCount: 500 },
    },
  }),
];

export const getProductionColorById = (id: string): ProductionColorDetail | undefined =>
  MOCK_PRODUCTION_COLORS.find((item) => item.id === id);

export const getProductionColorByOrderAndColor = (
  orderNo: string,
  color: string,
): ProductionColorDetail | undefined =>
  MOCK_PRODUCTION_COLORS.find((item) => item.productionOrderNo === orderNo && item.color === color);

export const toSummary = (detail: ProductionColorDetail): ProductionColorSummary => ({
  id: detail.id,
  productionOrderNo: detail.productionOrderNo,
  bulkStyleNo: detail.bulkStyleNo,
  po: detail.po,
  brand: detail.brand,
  color: detail.color,
  ...(detail.colorCode ? { colorCode: detail.colorCode } : {}),
  ...(detail.thumbnailUrl ? { thumbnailUrl: detail.thumbnailUrl } : {}),
  imageUrls: detail.imageUrls,
  status: detail.status,
  moduleStatus: detail.moduleStatus,
});

export const createDefaultMaterialItems = (productionColorId: string): MaterialItem[] => {
  const isPartial =
    productionColorId === 'pc-partial-material' || productionColorId === 'pc-multi-image';
  const isAll = [
    'pc-all-material',
    'pc-cutting',
    'pc-cutting-exception',
    'pc-sewing-today',
    'pc-sewing-history',
    'pc-packing',
    'pc-completed',
  ].includes(productionColorId);

  const fabricItems: MaterialItem[] = [
    {
      id: `${productionColorId}-fabric-1`,
      category: 'fabric',
      groupName: '主料/里料',
      name: '8754 50D绒感四面弹#',
      color: '蓝青色#1003',
      quantity: '120米',
      width: '150cm',
      supplier: '绍兴市柯桥区安昌街道前庄村前庄路88号',
      statuses: isAll
        ? ['arrived']
        : isPartial
          ? ['pending', 'shortage', 'quality_issue']
          : ['pending'],
    },
    {
      id: `${productionColorId}-fabric-2`,
      category: 'fabric',
      groupName: '主料/里料',
      name: '鹿纤绒加密',
      color: '黑色#0001',
      quantity: '80米',
      width: '140cm',
      supplier: '江南里布有限公司',
      statuses: isAll ? ['arrived'] : isPartial ? ['pending'] : ['pending'],
    },
    {
      id: `${productionColorId}-fabric-3`,
      category: 'fabric',
      groupName: '辅料',
      name: '隐形拉链 18寸0.43/条',
      color: '黑色',
      quantity: '500条',
      width: '-',
      supplier: '辅料之家',
      statuses: isAll ? ['arrived'] : isPartial ? ['arrived', 'quality_issue'] : ['pending'],
    },
  ];

  const packagingItems: MaterialItem[] = [
    {
      id: `${productionColorId}-pack-1`,
      category: 'packaging',
      groupName: '包装辅料',
      name: '纸箱',
      quantity: '要求足量',
      statuses: isAll ? ['arrived'] : ['pending', 'quality_issue'],
    },
    {
      id: `${productionColorId}-pack-2`,
      category: 'packaging',
      groupName: '包装辅料',
      name: '包装袋',
      quantity: '要求足量',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-pack-3`,
      category: 'packaging',
      groupName: '包装辅料',
      name: '吊牌',
      quantity: '要求足量',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-pack-4`,
      category: 'packaging',
      groupName: '包装辅料',
      name: '主唛',
      quantity: '要求足量',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-pack-5`,
      category: 'packaging',
      groupName: '包装辅料',
      name: '贴纸',
      quantity: '要求足量',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
  ];

  const dataItems: MaterialItem[] = [
    {
      id: `${productionColorId}-data-1`,
      category: 'data_package',
      groupName: '资料包',
      name: '生产要求',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-data-2`,
      category: 'data_package',
      groupName: '资料包',
      name: '尺寸表',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-data-3`,
      category: 'data_package',
      groupName: '资料包',
      name: '纸样',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-data-4`,
      category: 'data_package',
      groupName: '资料包',
      name: '工艺单',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
    {
      id: `${productionColorId}-data-5`,
      category: 'data_package',
      groupName: '资料包',
      name: '样衣',
      statuses: isAll ? ['arrived'] : ['pending'],
    },
  ];

  if (productionColorId === 'pc-material-exception-pending') {
    fabricItems[2] = {
      ...fabricItems[2]!,
      statuses: ['pending', 'shortage', 'quality_issue'],
    };
  }

  if (productionColorId === 'pc-material-exception-replied') {
    fabricItems[1] = { ...fabricItems[1]!, statuses: ['arrived', 'quality_issue'] };
  }

  return [...fabricItems, ...packagingItems, ...dataItems];
};
