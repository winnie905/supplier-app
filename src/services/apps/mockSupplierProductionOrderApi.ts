import type {
  ConfirmArriveMaterialInput,
  CreateExceptionRecordInput,
  ProductionOrderSupplierCount,
  ProductionOrderSupplierDetail,
  ProductionOrderSupplierSearchInput,
  ProductionOrderSupplierSearchRecord,
  ProductionOrderSupplierSearchResult,
  ProductionOrderSupplierStatisticInput,
  SupplierBomItem,
  SupplierExceptionRecord,
  SupplierMaterialPackage,
  SupplierProductionOrderStatus,
} from '@/types/supplierProductionOrder';

const MOCK_IMAGE =
  'https://img0.baidu.com/it/u=1414190783,2671516514&fm=253&app=138&f=JPEG?w=800&h=1200';

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

interface ColorSeed {
  id: number;
  color: string;
  quantity: number;
  legacyColorId?: string;
}

interface OrderSeed {
  productionOrderCode: string;
  status: SupplierProductionOrderStatus;
  requiredProductionDate: string;
  productCode: string;
  customerPO: string;
  brand: string;
  category: string;
  colors: ColorSeed[];
}

/**
 * 订单查询首页 mock：
 * 全部 18 / 待生产 5 / 生产中 3 / 已完成 10 / 超期 2
 * 超期 = 未完成且交期早于今天（2 张生产中单）
 */
const ORDER_SEEDS: OrderSeed[] = [
  // —— 待生产 5 ——
  {
    productionOrderCode: 'DS-2026-001',
    status: 'Pending',
    requiredProductionDate: '2026-08-10',
    productCode: 'SDG10001',
    customerPO: '240001',
    brand: 'APEX',
    category: '梭织·女士·连衣裙',
    colors: [{ id: 1001, color: '白色', quantity: 100, legacyColorId: 'pc-empty' }],
  },
  {
    productionOrderCode: 'DS-2026-002',
    status: 'Pending',
    requiredProductionDate: '2026-08-15',
    productCode: 'SDG10002',
    customerPO: '240002',
    brand: 'MODA',
    category: '针织·女士·上衣',
    colors: [{ id: 1002, color: '米色', quantity: 120 }],
  },
  {
    productionOrderCode: 'DS-2026-003',
    status: 'Pending',
    requiredProductionDate: '2026-08-20',
    productCode: 'SDG10003',
    customerPO: '240003',
    brand: 'LUXE',
    category: '梭织·女士·半身裙',
    colors: [{ id: 1003, color: '浅蓝', quantity: 80 }],
  },
  {
    productionOrderCode: 'DS-2026-004',
    status: 'Pending',
    requiredProductionDate: '2026-09-01',
    productCode: 'SDG10004',
    customerPO: '240004',
    brand: 'APEX',
    category: '针织·女士·连衣裙',
    colors: [{ id: 1004, color: '杏色', quantity: 150 }],
  },
  {
    productionOrderCode: 'DS-2026-005',
    status: 'Pending',
    requiredProductionDate: '2026-09-10',
    productCode: 'SDG10005',
    customerPO: '240005',
    brand: 'SUPERDOWN',
    category: '梭织·女士·衬衫',
    colors: [{ id: 1005, color: '奶白', quantity: 90 }],
  },
  // —— 生产中 3（其中 2 张超期）——
  {
    productionOrderCode: 'DS-2026-031',
    status: 'InProgress',
    requiredProductionDate: '2026-08-20',
    productCode: 'SDQ10070-F26',
    customerPO: '230101',
    brand: 'SUPERDOWN',
    category: '梭织·女士·连衣裙',
    colors: [
      { id: 1031, color: '卡其色', quantity: 220, legacyColorId: 'pc-partial-material' },
      { id: 1032, color: '玫红色', quantity: 180, legacyColorId: 'pc-all-material' },
    ],
  },
  {
    productionOrderCode: 'DS-2026-032',
    status: 'InProgress',
    requiredProductionDate: '2026-06-01',
    productCode: 'SDG22334',
    customerPO: '240088',
    brand: 'MODA',
    category: '针织·女士·连衣裙',
    colors: [{ id: 1033, color: '藏青', quantity: 200, legacyColorId: 'pc-cutting-exception' }],
  },
  {
    productionOrderCode: 'DS-2026-033',
    status: 'InProgress',
    requiredProductionDate: '2026-07-01',
    productCode: 'SDG33445',
    customerPO: '240099',
    brand: 'LUXE',
    category: '梭织·女士·外套',
    colors: [
      { id: 1034, color: '红色', quantity: 160, legacyColorId: 'pc-material-exception-pending' },
    ],
  },
  // —— 已完成 10 ——
  {
    productionOrderCode: 'DS-2026-041',
    status: 'Finished',
    requiredProductionDate: '2026-05-10',
    productCode: 'SDG41001',
    customerPO: '241001',
    brand: 'APEX',
    category: '梭织·女士·连衣裙',
    colors: [{ id: 1041, color: '黑色', quantity: 100, legacyColorId: 'pc-completed' }],
  },
  {
    productionOrderCode: 'DS-2026-042',
    status: 'Finished',
    requiredProductionDate: '2026-05-15',
    productCode: 'SDG41002',
    customerPO: '241002',
    brand: 'MODA',
    category: '针织·女士·上衣',
    colors: [{ id: 1042, color: '灰色', quantity: 110 }],
  },
  {
    productionOrderCode: 'DS-2026-043',
    status: 'Finished',
    requiredProductionDate: '2026-05-20',
    productCode: 'SDG41003',
    customerPO: '241003',
    brand: 'LUXE',
    category: '梭织·女士·半身裙',
    colors: [{ id: 1043, color: '酒红', quantity: 95 }],
  },
  {
    productionOrderCode: 'DS-2026-044',
    status: 'Finished',
    requiredProductionDate: '2026-06-01',
    productCode: 'SDG41004',
    customerPO: '241004',
    brand: 'SUPERDOWN',
    category: '针织·女士·连衣裙',
    colors: [{ id: 1044, color: '墨绿', quantity: 130 }],
  },
  {
    productionOrderCode: 'DS-2026-045',
    status: 'Finished',
    requiredProductionDate: '2026-06-08',
    productCode: 'SDG41005',
    customerPO: '241005',
    brand: 'APEX',
    category: '梭织·女士·衬衫',
    colors: [{ id: 1045, color: '浅蓝', quantity: 85 }],
  },
  {
    productionOrderCode: 'DS-2026-046',
    status: 'Finished',
    requiredProductionDate: '2026-06-15',
    productCode: 'SDG41006',
    customerPO: '241006',
    brand: 'MODA',
    category: '针织·女士·外套',
    colors: [{ id: 1046, color: '驼色', quantity: 140 }],
  },
  {
    productionOrderCode: 'DS-2026-047',
    status: 'Finished',
    requiredProductionDate: '2026-06-22',
    productCode: 'SDG41007',
    customerPO: '241007',
    brand: 'LUXE',
    category: '梭织·女士·连衣裙',
    colors: [{ id: 1047, color: '粉色', quantity: 105 }],
  },
  {
    productionOrderCode: 'DS-2026-048',
    status: 'Finished',
    requiredProductionDate: '2026-07-01',
    productCode: 'SDG41008',
    customerPO: '241008',
    brand: 'SUPERDOWN',
    category: '针织·女士·上衣',
    colors: [{ id: 1048, color: '橘色', quantity: 115 }],
  },
  {
    productionOrderCode: 'DS-2026-049',
    status: 'Finished',
    requiredProductionDate: '2026-07-08',
    productCode: 'SDG41009',
    customerPO: '241009',
    brand: 'APEX',
    category: '梭织·女士·半身裙',
    colors: [{ id: 1049, color: '紫色', quantity: 90 }],
  },
  {
    productionOrderCode: 'DS-2026-050',
    status: 'Finished',
    requiredProductionDate: '2026-07-15',
    productCode: 'SDG41010',
    customerPO: '241010',
    brand: 'MODA',
    category: '针织·女士·连衣裙',
    colors: [{ id: 1050, color: '卡其', quantity: 125 }],
  },
];

const flattenColors = (): (ColorSeed & { order: OrderSeed })[] =>
  ORDER_SEEDS.flatMap((order) => order.colors.map((color) => ({ ...color, order })));

const normalizeStatus = (status: string): SupplierProductionOrderStatus => {
  if (status === 'Finished') return 'Finished';
  if (status === 'InProgress' || status === 'PartialComplete') return 'InProgress';
  return 'Pending';
};

/** 超期：未完成且交期早于今天 */
const isOrderOverTime = (order: OrderSeed, todayStr = today()) =>
  normalizeStatus(order.status) !== 'Finished' &&
  Boolean(order.requiredProductionDate && todayStr > order.requiredProductionDate);

const orderQuantity = (order: OrderSeed) =>
  order.colors.reduce((sum, color) => sum + color.quantity, 0);

const buildBomItems = (productionId: number): SupplierBomItem[] => [
  {
    id: productionId * 10 + 1,
    type: '面料',
    name: '主身面料',
    materialColor: '本色',
    supplierName: '绍兴面料厂',
    category: '面料',
    width: '150cm',
    weight: '180g',
    meters: '120',
    receiveMaterialStatus: 'PENDING',
    material: {
      id: productionId * 10 + 1,
      name: '主身面料',
      color: '本色',
      code: `M-${productionId}-01`,
      imageUrls: [MOCK_IMAGE],
    },
    unit: { id: 1, name: '米', unit: 'm' },
  },
  {
    id: productionId * 10 + 2,
    type: '辅料',
    name: '拉链',
    materialColor: '黑色',
    supplierName: '义乌辅料',
    category: '辅料',
    receiveMaterialStatus: 'PENDING',
    material: {
      id: productionId * 10 + 2,
      name: '拉链',
      color: '黑色',
      code: `M-${productionId}-02`,
    },
    unit: { id: 2, name: '条', unit: 'pcs' },
  },
];

const buildPackages = (productionId: number): SupplierMaterialPackage[] => [
  {
    id: `pkg-${productionId}-1`,
    name: '主身物料包',
    receiveMaterialStatus: 'PENDING',
    remark: '',
  },
];

const buildPackMaterials = (productionId: number): SupplierMaterialPackage[] => [
  {
    id: `pack-${productionId}-1`,
    name: '吊牌包装',
    receiveMaterialStatus: 'PENDING',
    remark: '',
  },
];

/** 可变 mock 详情缓存（确认到料 / 异常会上写） */
const detailStore = new Map<string, ProductionOrderSupplierDetail>();

const detailKey = (productionOrderCode: string, color: string) =>
  `${productionOrderCode}::${color}`;

const buildDetail = (order: OrderSeed, seed: ColorSeed): ProductionOrderSupplierDetail => {
  const detail: ProductionOrderSupplierDetail = {
    productionOrderCode: order.productionOrderCode,
    id: seed.id,
    code: `DN-${order.productionOrderCode}`,
    type: '连衣裙',
    color: seed.color,
    purchaseCode: `PC-${seed.id}`,
    status: order.status,
    saleOrderCode: `SO-${order.productionOrderCode}`,
    orderStatus: 'Pending',
    materialStatus: 'Pending',
    productionType: '包工包料',
    comment: '',
    factoryPlanedProductionDate: order.requiredProductionDate,
    orderType: 'FOB',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    factory: {
      id: 1,
      name: '义乌市妍姿针织有限公司',
      fullName: '义乌市妍姿针织有限公司',
      phone: '0579-0000000',
      contact: '张工厂',
    },
    receiveWarehouse: {
      id: 1,
      name: '默认收货仓',
      contact: '仓管',
      phone: '0579-1111111',
    },
    customerPurchaseOrder: {
      saleOrderCode: `SO-${order.productionOrderCode}`,
      productCode: order.productCode,
      customerPO: order.customerPO,
      color: seed.color,
      colorCode: 'BK-01',
      code: `DN-${order.productionOrderCode}`,
      type: '连衣裙',
      quantity: seed.quantity,
      requiredProductionDate: order.requiredProductionDate,
      sizeRange: [
        { name: 'XS', quantity: Math.max(1, Math.floor(seed.quantity * 0.1)) },
        { name: 'S', quantity: Math.max(1, Math.floor(seed.quantity * 0.2)) },
        { name: 'M', quantity: Math.max(1, Math.floor(seed.quantity * 0.3)) },
        { name: 'L', quantity: Math.max(1, Math.floor(seed.quantity * 0.25)) },
        { name: 'XL', quantity: Math.max(1, Math.floor(seed.quantity * 0.15)) },
      ],
      brand: { id: 1, name: order.brand, customerId: 1 },
      productionFollower: {
        id: 1,
        username: 'wangxiaomei',
        firstName: '王',
        lastName: '小美',
      },
      businessFollower: {
        id: 2,
        username: 'lisi',
        firstName: '李',
        lastName: '四',
      },
      packageAttachment: [
        MOCK_IMAGE,
        'https://img1.baidu.com/it/u=1605435782,2325839849&fm=253&app=138&f=JPEG?w=800&h=1200',
      ],
    },
    templateDesign: {
      code: order.productCode,
      type: 'bulk',
      customerCode: 'CUS-7788',
      category: order.category,
      designImageUrls: [MOCK_IMAGE],
      brand: { id: 1, name: order.brand, customerId: 1 },
    },
    bomItems: buildBomItems(seed.id).map((item, index) => {
      if (seed.legacyColorId === 'pc-all-material') {
        return { ...item, receiveMaterialStatus: 'ARRIVED' as const };
      }
      if (seed.legacyColorId === 'pc-partial-material' && index === 0) {
        return { ...item, receiveMaterialStatus: 'ARRIVED' as const };
      }
      return item;
    }),
    materialPackages: buildPackages(seed.id).map((item) =>
      seed.legacyColorId === 'pc-all-material'
        ? { ...item, receiveMaterialStatus: 'ARRIVED' as const }
        : item,
    ),
    packMaterials: buildPackMaterials(seed.id).map((item) =>
      seed.legacyColorId === 'pc-all-material'
        ? { ...item, receiveMaterialStatus: 'ARRIVED' as const }
        : item,
    ),
    exceptionRecords:
      seed.legacyColorId === 'pc-cutting-exception'
        ? [
            {
              id: 'exc-1033-1',
              productionId: seed.id,
              module: 'cutting',
              type: '裁数不足',
              reportedAt: '2026-06-02T10:00:00Z',
              reportContent: '裁片数量不符',
              isReplied: false,
              reporter: { id: 1, username: 'factory', firstName: '工', lastName: '厂' },
            },
          ]
        : seed.legacyColorId === 'pc-material-exception-pending'
          ? [
              {
                id: 'exc-1034-1',
                productionId: seed.id,
                module: 'material',
                type: '缺料',
                reportedAt: '2026-06-10T09:00:00Z',
                reportContent: '【缺料】拉链\n到料数量不足',
                isReplied: false,
                moduleExtend: { relatedItemIds: [`bom-${seed.id * 10 + 2}`] },
                reporter: { id: 1, username: 'factory', firstName: '工', lastName: '厂' },
              },
            ]
          : [],
  };

  if (seed.legacyColorId === 'pc-all-material') {
    detail.factoryReceiveMaterialStatus = 'COMPLETE';
  } else if (seed.legacyColorId === 'pc-partial-material') {
    detail.factoryReceiveMaterialStatus = 'PART';
  }

  return detail;
};

const findColorInOrders = (productionOrderCode: string, color: string) => {
  const order = ORDER_SEEDS.find((item) => item.productionOrderCode === productionOrderCode);
  if (!order) return null;
  const seed = order.colors.find((item) => item.color === color);
  if (!seed) return null;
  return { order, seed };
};

const ensureDetail = (productionOrderCode: string, color: string) => {
  const key = detailKey(productionOrderCode, color);
  const cached = detailStore.get(key);
  if (cached) return cached;

  const matched = findColorInOrders(productionOrderCode, color);
  if (!matched) return null;

  const detail = buildDetail(matched.order, matched.seed);
  detailStore.set(key, detail);
  return detail;
};

ORDER_SEEDS.forEach((order) => {
  order.colors.forEach((seed) => {
    detailStore.set(detailKey(order.productionOrderCode, seed.color), buildDetail(order, seed));
  });
});

const buildSearchRecord = (order: OrderSeed): ProductionOrderSupplierSearchRecord => {
  const qty = orderQuantity(order);
  return {
    saleOrderCode: `SO-${order.productionOrderCode}`,
    productionOrderCode: order.productionOrderCode,
    code: `DN-${order.productionOrderCode}`,
    type: '连衣裙',
    productionOrderType: 'bulk',
    customerCode: 'CUS-7788',
    customerPO: order.customerPO,
    productCode: order.productCode,
    category: order.category,
    designImageUrls: [MOCK_IMAGE],
    requiredProductionDate: order.requiredProductionDate,
    brand: { id: 1, name: order.brand, customerId: 1 },
    businessFollower: { id: 2, username: 'lisi', firstName: '李', lastName: '四' },
    productionFollower: {
      id: 1,
      username: 'wangxiaomei',
      firstName: '王',
      lastName: '小美',
    },
    productionType: '包工包料',
    quantity: qty,
    productionOrderStatus: order.status,
    factoryPlanedProductionDate: order.requiredProductionDate,
    productionOrders: order.colors.map((seed) => ({
      id: seed.id,
      productionOrderCode: order.productionOrderCode,
      code: `DN-${order.productionOrderCode}`,
      type: '连衣裙',
      color: seed.color,
      status: order.status,
      factoryPlanedProductionDate: order.requiredProductionDate,
      quantity: seed.quantity,
    })),
  };
};

export const MOCK_SUPPLIER_PRODUCTION_ORDER_CODE = 'DS-2026-031';

export const MOCK_SUPPLIER_PRODUCTION_COLOR_LEGACY_IDS: Record<number, string> = Object.fromEntries(
  flattenColors()
    .filter((item) => item.legacyColorId)
    .map((item) => [item.id, item.legacyColorId!]),
);

const calcStatisticForOrders = (orders: OrderSeed[]): ProductionOrderSupplierCount => {
  const todayStr = today();
  let pendingCount = 0;
  let inProgressCount = 0;
  let finishedCount = 0;
  let pendingQuantity = 0;
  let inProgressQuantity = 0;
  let finishedQuantity = 0;
  let overTimeCount = 0;
  let overTimeQuantity = 0;

  for (const order of orders) {
    const qty = orderQuantity(order);
    const status = normalizeStatus(order.status);
    if (status === 'Pending') {
      pendingCount += 1;
      pendingQuantity += qty;
    } else if (status === 'Finished') {
      finishedCount += 1;
      finishedQuantity += qty;
    } else {
      inProgressCount += 1;
      inProgressQuantity += qty;
    }
    if (isOrderOverTime(order, todayStr)) {
      overTimeCount += 1;
      overTimeQuantity += qty;
    }
  }

  return {
    pendingCount,
    inProgressCount,
    finishedCount,
    pendingQuantity,
    inProgressQuantity,
    finishedQuantity,
    overTimeCount,
    overTimeQuantity,
  };
};

export const getMockStatistic = (
  input: ProductionOrderSupplierStatisticInput = {},
): ProductionOrderSupplierCount => {
  let orders = ORDER_SEEDS;

  if (input.productionOrderCode) {
    orders = orders.filter((item) => item.productionOrderCode === input.productionOrderCode);
  }

  if (input.isOverTime === true) {
    const todayStr = today();
    orders = orders.filter((item) => isOrderOverTime(item, todayStr));
  }

  return calcStatisticForOrders(orders);
};

export const getMockSearch = (
  input: ProductionOrderSupplierSearchInput = {},
): ProductionOrderSupplierSearchResult => {
  const page = input.page && input.page > 0 ? input.page : 1;
  const size = input.size && input.size > 0 ? input.size : 20;
  const keyword = (input.keyword ?? '').trim().toLowerCase();
  const todayStr = today();

  let orders = [...ORDER_SEEDS];

  if (input.productionOrderCode) {
    orders = orders.filter((item) => item.productionOrderCode === input.productionOrderCode);
  }

  if (keyword) {
    orders = orders.filter((order) => {
      // 关键字匹配大货款号 / 客户PO / 品牌
      const haystack = [order.productCode, order.customerPO, order.brand].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }

  if (input.isOverTime === true) {
    orders = orders.filter((item) => isOrderOverTime(item, todayStr));
  }

  const records = orders.map(buildSearchRecord);
  const total = records.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const start = (page - 1) * size;
  const pageRecords = records.slice(start, start + size);

  return {
    total,
    size,
    pages,
    page,
    records: pageRecords,
    statistic: getMockStatistic({
      ...(input.productionOrderCode != null
        ? { productionOrderCode: input.productionOrderCode }
        : {}),
      ...(input.isOverTime != null ? { isOverTime: input.isOverTime } : {}),
    }),
  };
};

export const getMockDetail = (
  productionOrderCode: string,
  color: string,
): ProductionOrderSupplierDetail | null => {
  if (!productionOrderCode) return null;

  const matched = findColorInOrders(productionOrderCode, color);
  if (matched) {
    return ensureDetail(productionOrderCode, matched.seed.color);
  }

  // 未知色：若生产单存在则回落首色，便于联调
  const order = ORDER_SEEDS.find((item) => item.productionOrderCode === productionOrderCode);
  if (order?.colors[0]) {
    return ensureDetail(productionOrderCode, order.colors[0].color);
  }

  return null;
};

export const getMockDetailById = (productionId: number): ProductionOrderSupplierDetail | null => {
  const entry = [...detailStore.values()].find((item) => item.id === productionId);
  return entry ?? null;
};

export const mockConfirmArriveMaterial = (
  productionId: number,
  input: ConfirmArriveMaterialInput,
): ProductionOrderSupplierDetail | null => {
  const entry = [...detailStore.values()].find((item) => item.id === productionId);
  if (!entry) return null;

  const markSelectedArrived = <T extends { id: number | string; receiveMaterialStatus?: string }>(
    existing: T[] = [],
    incoming: T[] = [],
  ): T[] => {
    if (!incoming.length) return existing;
    const ids = new Set(incoming.map((item) => String(item.id)));
    return existing.map((item) =>
      ids.has(String(item.id)) ? { ...item, receiveMaterialStatus: 'ARRIVED' } : item,
    );
  };

  entry.bomItems = markSelectedArrived(entry.bomItems ?? [], input.bomItems ?? []);
  entry.materialPackages = markSelectedArrived(
    entry.materialPackages ?? [],
    input.materialPackages ?? [],
  );
  entry.packMaterials = markSelectedArrived(entry.packMaterials ?? [], input.packMaterials ?? []);

  const allArrived = [
    ...(entry.bomItems ?? []),
    ...(entry.materialPackages ?? []),
    ...(entry.packMaterials ?? []),
  ].every((item) => item.receiveMaterialStatus === 'ARRIVED');

  entry.factoryReceiveMaterialStatus = allArrived ? 'COMPLETE' : 'PART';
  entry.updatedAt = new Date().toISOString();
  detailStore.set(detailKey(entry.productionOrderCode, entry.color), entry);
  return entry;
};

export const mockCreateExceptionRecord = (
  input: CreateExceptionRecordInput,
): SupplierExceptionRecord => {
  const record: SupplierExceptionRecord = {
    id: `exc-${Date.now()}`,
    productionId: input.productionId,
    module: input.module,
    moduleExtend: input.moduleExtend ?? {},
    type: input.type,
    reportedAt: new Date().toISOString(),
    reportContent: input.reportContent ?? '',
    isReplied: false,
    ...(input.reporter != null ? { reporter: input.reporter } : {}),
  };

  const entry = [...detailStore.values()].find((item) => item.id === input.productionId);
  if (entry) {
    entry.exceptionRecords = [...(entry.exceptionRecords ?? []), record];

    const relatedItemIds = Array.isArray(input.moduleExtend?.relatedItemIds)
      ? (input.moduleExtend.relatedItemIds as string[])
      : [];
    const nextStatus =
      input.type === '缺料' ? 'SHORTAGE' : input.type === '质量问题' ? 'QUALITY_ISSUE' : undefined;

    if (nextStatus && relatedItemIds.length) {
      const idSet = new Set(relatedItemIds);
      entry.bomItems = (entry.bomItems ?? []).map((item) =>
        idSet.has(`bom-${item.id}`) ? { ...item, receiveMaterialStatus: nextStatus } : item,
      );
      entry.packMaterials = (entry.packMaterials ?? []).map((item) =>
        idSet.has(`pack-${item.id}`) ? { ...item, receiveMaterialStatus: nextStatus } : item,
      );
      entry.materialPackages = (entry.materialPackages ?? []).map((item) =>
        idSet.has(`pkg-${item.id}`) ? { ...item, receiveMaterialStatus: nextStatus } : item,
      );
    }

    detailStore.set(detailKey(entry.productionOrderCode, entry.color), entry);
  }

  return record;
};

export const listMockColorSeeds = () =>
  flattenColors().map(({ order, ...color }) => ({
    ...color,
    status: order.status,
    requiredProductionDate: order.requiredProductionDate,
    legacyColorId: color.legacyColorId ?? '',
  }));
