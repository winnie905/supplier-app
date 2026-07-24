import {
  type Brand,
  type CategoryItem,
  type CustomerPurchaseOrderOnProductionOrder,
  MaterialBulkPurchaseOrderStatus,
  OrderStatus,
  ProductionOrderStatus,
  type ProductionOrderVO,
  ProductionStatus,
  type Supplier,
  type TemplateDesign,
  type User,
  type Warehouse,
} from '@/types/productionOrder';

const MOCK_IMAGE_URL =
  'https://img0.baidu.com/it/u=1414190783,2671516514&fm=253&app=138&f=JPEG?w=800&h=1200';

export const MOCK_SUPPLIER_NAME = '义乌市妍姿针织有限公司';

const emptyUser = (name: string): User => ({
  username: name,
  email: '',
  firstName: name,
  lastName: '',
  avatar: '',
  dateOfBirth: '',
  gender: '',
});

const emptyCategory = (name: string): CategoryItem => ({
  id: name,
  name,
  parentId: null,
  type: 'department',
});

const brand = (name: string, customerId = 1): Brand => ({
  name,
  customerId,
});

const factory: Supplier = {
  id: 1,
  name: MOCK_SUPPLIER_NAME,
};

const warehouse: Warehouse = {
  id: 1,
  name: '默认收货仓',
};

const follower = emptyUser('王小美');

const baseCpo = (
  partial: Partial<CustomerPurchaseOrderOnProductionOrder> &
    Pick<
      CustomerPurchaseOrderOnProductionOrder,
      'productCode' | 'customerPO' | 'color' | 'colorCode' | 'quantity' | 'requiredProductionDate'
    >,
): CustomerPurchaseOrderOnProductionOrder => ({
  saleOrderCode: 'SO-2026-001',
  ingredient: '',
  code: 'DN-2024-088',
  type: '连衣裙',
  saleOrderDate: '2026-01-01',
  purchaseCode: 'PC-001',
  unitPrice: 0,
  rmbUnitPrice: 0,
  isUnderApproval: false,
  currencyRate: 1,
  currency: 'CNY',
  refPurchaseCode: '',
  firstClothOutboundOrderStatus: 'Created',
  firstActualOutboundDate: '',
  saleComment: '',
  destination: '',
  deliveryMethod: '',
  inspectionMethod: '',
  inspectionDescription: '',
  inspectionRate: '',
  ingredientDescription: '',
  customerComment: '',
  sizeRange: [
    { name: 'XS', quantity: 20 },
    { name: 'S', quantity: 40 },
    { name: 'M', quantity: 60 },
    { name: 'L', quantity: 50 },
    { name: 'XL', quantity: 30 },
  ],
  customerColor: partial.color,
  quoteStatus: OrderStatus.OrderCreated,
  saleOrderStatus: OrderStatus.OrderCreated,
  productionOrderStatus: OrderStatus.OrderCreated,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  businessFollower: follower,
  department: emptyCategory('业务部'),
  group: emptyCategory('一组'),
  productionFollower: follower,
  brand: brand('SUPERDOWN'),
  ...partial,
});

const baseTemplateDesign = (partial?: Partial<TemplateDesign>): TemplateDesign => ({
  customerCode: 'CUS-7788',
  type: 'bulk',
  designImageUrls: [MOCK_IMAGE_URL],
  developmentType: 'FOB',
  category: '梭织·女士·连衣裙',
  ...partial,
});

interface VoSeed {
  id: number;
  /** 与收发管理 mock 的 productionColorId 对齐 */
  legacyColorId: string;
  color: string;
  status: ProductionStatus;
  requiredProductionDate: string;
  quantity: number;
  productCode?: string;
  customerPO?: string;
  brandName?: string;
  productionOrderCode?: string;
  category?: string;
  imageCount?: number;
}

const voFromSeed = (seed: VoSeed): ProductionOrderVO => {
  const productionOrderCode = seed.productionOrderCode ?? 'DS-2026-031';
  const productCode = seed.productCode ?? 'SDQ10070-F26';
  const customerPO = seed.customerPO ?? '230101';
  const brandName = seed.brandName ?? 'SUPERDOWN';
  const images = Array.from({ length: seed.imageCount ?? 1 }, () => MOCK_IMAGE_URL);

  return {
    id: seed.id,
    code: 'DN-2024-088',
    type: '连衣裙',
    color: seed.color,
    purchaseCode: 'PC-001',
    status: seed.status,
    totalOutboundQuantity: 0,
    totalPurchasePrice: 0,
    saleOrderCode: 'SO-2026-001',
    orderStatus: ProductionOrderStatus.Finished,
    materialStatus: MaterialBulkPurchaseOrderStatus.Pending,
    nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus.Pending,
    productionType: '包工包料',
    productionOrderCode,
    comment: '',
    factoryPlanedProductionDate: seed.requiredProductionDate,
    factory,
    receiveWarehouse: warehouse,
    rmbUnitPrice: 0,
    rmbPrice: 0,
    externalRmbUnitPrice: 0,
    externalRmbPrice: 0,
    externalUnitPrice: 0,
    externalPrice: 0,
    secondaryProcessPrice: 0,
    externalCurrency: 'USD',
    externalCurrencyRate: 1,
    orderType: 'FOB',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    customerPurchaseOrder: baseCpo({
      productCode,
      customerPO,
      color: seed.color,
      colorCode: 'BK-01',
      quantity: seed.quantity,
      requiredProductionDate: seed.requiredProductionDate,
      brand: brand(brandName),
      customerColor: seed.color,
    }),
    templateDesign: baseTemplateDesign({
      category: seed.category ?? '梭织·女士·连衣裙',
      designImageUrls: images,
      brand: brand(brandName),
    }),
    shipInformation: '',
    cropOrder: {},
    template: {},
    user: follower,
    lastUpdater: follower,
    bomItems: [],
    productionProcesses: [],
    secondaryProcesses: [],
  };
};

/**
 * 与收发 mock 色卡 id 对齐的 ProductionOrderVO 列表（一条 = 一个生产色）。
 * legacyColorId 仅用于桥接旧收发 mock；对外以 VO.id 为准。
 */
export const MOCK_PRODUCTION_ORDER_COLOR_IDS: Record<number, string> = {
  1001: 'pc-partial-material',
  1002: 'pc-all-material',
  1003: 'pc-multi-image',
  1004: 'pc-cutting',
  1005: 'pc-sewing-today',
  1006: 'pc-empty',
  1007: 'pc-completed',
  1008: 'pc-cutting-exception',
};

export const MOCK_PRODUCTION_ORDERS: ProductionOrderVO[] = [
  voFromSeed({
    id: 1001,
    legacyColorId: 'pc-partial-material',
    color: '卡其色',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-08-20',
    quantity: 220,
  }),
  voFromSeed({
    id: 1002,
    legacyColorId: 'pc-all-material',
    color: '玫红色',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-08-25',
    quantity: 180,
  }),
  voFromSeed({
    id: 1003,
    legacyColorId: 'pc-multi-image',
    color: '灰色',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-09-01',
    quantity: 200,
    imageCount: 6,
  }),
  voFromSeed({
    id: 1004,
    legacyColorId: 'pc-cutting',
    color: '藏青',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-09-05',
    quantity: 160,
  }),
  voFromSeed({
    id: 1005,
    legacyColorId: 'pc-sewing-today',
    color: '粉色',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-09-10',
    quantity: 140,
  }),
  voFromSeed({
    id: 1006,
    legacyColorId: 'pc-empty',
    color: '白色',
    status: ProductionStatus.Ordered,
    requiredProductionDate: '2026-09-15',
    quantity: 120,
  }),
  voFromSeed({
    id: 1007,
    legacyColorId: 'pc-completed',
    color: '黑色',
    status: ProductionStatus.Finished,
    requiredProductionDate: '2026-08-01',
    quantity: 100,
  }),
  voFromSeed({
    id: 1008,
    legacyColorId: 'pc-cutting-exception',
    color: '卡其',
    status: ProductionStatus.InProgress,
    requiredProductionDate: '2026-06-01',
    quantity: 90,
  }),
];

export const getLegacyColorId = (voId: number): string =>
  MOCK_PRODUCTION_ORDER_COLOR_IDS[voId] ?? String(voId);

export const getProductionOrderVoById = (id: number): ProductionOrderVO | undefined =>
  MOCK_PRODUCTION_ORDERS.find((item) => item.id === id);

export const getProductionOrderVoByLegacyColorId = (
  legacyColorId: string,
): ProductionOrderVO | undefined => {
  const entry = Object.entries(MOCK_PRODUCTION_ORDER_COLOR_IDS).find(
    ([, value]) => value === legacyColorId,
  );
  if (!entry) return undefined;
  return getProductionOrderVoById(Number(entry[0]));
};
