import type { BoxSpecification } from '@/types/boxSpecification';
import type {
  CropOrder,
  CropOrderStatistic,
  CropOrderStatisticInput,
  CropOrderType,
  CropProcess,
  SewOrder,
  SewOrderStatistic,
  SewOrderStatisticInput,
  TailOrder,
  TailOrderStatistic,
  TailOrderStatisticInput,
  WorkshopProductionOrderRef,
} from '@/types/cropOrder';

const nowIso = () => new Date().toISOString();

const MOCK_USER = {
  id: 1,
  username: 'factory',
  firstName: '工',
  lastName: '厂',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;

const buildProductionRef = (params: {
  id: number;
  productionOrderCode: string;
  color: string;
  productCode: string;
  quantity: number;
}): WorkshopProductionOrderRef => ({
  id: params.id,
  productionOrderCode: params.productionOrderCode,
  code: `DN-${params.productionOrderCode}`,
  type: '连衣裙',
  color: params.color,
  status: 'InProgress',
  saleOrderCode: `SO-${params.productionOrderCode}`,
  factoryPlanedProductionDate: '2026-08-20',
  customerPurchaseOrder: {
    saleOrderCode: `SO-${params.productionOrderCode}`,
    productCode: params.productCode,
    customerPO: '230101',
    color: params.color,
    quantity: params.quantity,
    requiredProductionDate: '2026-08-20',
    sizeRange: SIZES.map((name, index) => ({
      name,
      quantity: Math.max(1, Math.floor(params.quantity * [0.1, 0.2, 0.3, 0.25, 0.15][index]!)),
    })),
    brand: { id: 1, name: 'SUPERDOWN', customerId: 1 },
  },
  templateDesign: {
    code: params.productCode,
    category: '梭织·女士·连衣裙',
    designImageUrls: [
      'https://img0.baidu.com/it/u=1414190783,2671516514&fm=253&app=138&f=JPEG?w=800&h=1200',
    ],
    brand: { id: 1, name: 'SUPERDOWN', customerId: 1 },
  },
});

const sumProcessQty = (processes: CropProcess[]) =>
  processes.reduce((sum, process) => {
    if (typeof process.totalQuantity === 'number') return sum + process.totalQuantity;
    const fromSizes =
      process.sizeRange?.reduce((inner, item) => inner + (item.cropQuantity ?? 0), 0) ?? 0;
    return sum + fromSizes;
  }, 0);

const withStorageTotals = <T extends CropOrder>(order: T): T => {
  const processes = order.cropOrderStorage?.cropProcesses ?? [];
  return {
    ...order,
    cropOrderStorage: {
      cropProcesses: processes,
      cropTotal: sumProcessQty(processes),
    },
    updatedAt: nowIso(),
  };
};

const withTailStorageTotals = (order: TailOrder): TailOrder => {
  const base = withStorageTotals(order);
  const tailProcesses = order.tailOrderStorage?.cropProcesses ?? [];
  return {
    ...base,
    tailOrderStorage: {
      cropProcesses: tailProcesses,
      cropTotal: sumProcessQty(tailProcesses),
    },
  };
};

/** 与供应商生产色 mock id 对齐：裁床单 id = 生产色 id */
const CROP_SEEDS: CropOrder[] = [
  withStorageTotals({
    id: 1031,
    status: 'InProgress',
    cropOrderType: 'CROP_ORDER',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
    productionOrder: buildProductionRef({
      id: 1031,
      productionOrderCode: 'DS-2026-031',
      color: '卡其色',
      productCode: 'SDQ10070-F26',
      quantity: 220,
    }),
    cropOrderStorage: {
      cropProcesses: [
        {
          id: 'crop-1031-1',
          cropDate: '2026-07-18T09:00:00Z',
          type: 'machine',
          parameter: 12,
          totalQuantity: 48,
          sizeRange: [
            { name: 'XS', cropQuantity: 4 },
            { name: 'S', cropQuantity: 10 },
            { name: 'M', cropQuantity: 14 },
            { name: 'L', cropQuantity: 12 },
            { name: 'XL', cropQuantity: 8 },
          ],
          maintainer: MOCK_USER,
          maintenanceDate: '2026-07-18T09:00:00Z',
        },
        {
          id: 'crop-1031-2',
          cropDate: '2026-07-20T11:00:00Z',
          type: 'machine',
          parameter: 8,
          totalQuantity: 32,
          sizeRange: [
            { name: 'XS', cropQuantity: 2 },
            { name: 'S', cropQuantity: 6 },
            { name: 'M', cropQuantity: 10 },
            { name: 'L', cropQuantity: 8 },
            { name: 'XL', cropQuantity: 6 },
          ],
          maintainer: MOCK_USER,
          maintenanceDate: '2026-07-20T11:00:00Z',
        },
      ],
    },
  }),
  withStorageTotals({
    id: 1033,
    status: 'Pending',
    cropOrderType: 'CROP_ORDER',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
    productionOrder: buildProductionRef({
      id: 1033,
      productionOrderCode: 'DS-2026-032',
      color: '藏青',
      productCode: 'SDG22334',
      quantity: 200,
    }),
    cropOrderStorage: {
      cropProcesses: [],
    },
  }),
];

/** 车缝单 mock（swagger 同构；sizeRange 暂按当日合计件数） */
const SEW_SEEDS: SewOrder[] = [
  withStorageTotals({
    id: 1031,
    status: 'InProgress',
    cropOrderType: 'CROP_ORDER',
    createdAt: '2026-07-10T08:00:00Z',
    updatedAt: '2026-07-22T16:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
    productionOrder: buildProductionRef({
      id: 1031,
      productionOrderCode: 'DS-2026-031',
      color: '卡其色',
      productCode: 'SDQ10070-F26',
      quantity: 220,
    }),
    cropOrderStorage: {
      cropProcesses: [
        {
          id: 'sew-1031-20260722',
          cropDate: '2026-07-22T08:00:00Z',
          type: 'machine',
          totalQuantity: 40,
          sizeRange: [
            { name: 'XS', cropQuantity: 4 },
            { name: 'S', cropQuantity: 8 },
            { name: 'M', cropQuantity: 12 },
            { name: 'L', cropQuantity: 10 },
            { name: 'XL', cropQuantity: 6 },
          ],
          maintainer: MOCK_USER,
          maintenanceDate: '2026-07-22T16:00:00Z',
        },
      ],
    },
  }),
];

/** 尾部单 mock：装箱记录放在 tailOrderStorage；id 与生产色对齐 */
const TAIL_SEEDS: TailOrder[] = [
  withTailStorageTotals({
    id: 1031,
    status: 'InProgress',
    cropOrderType: 'TAIL_ORDER',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-07-22T18:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
    productionOrder: buildProductionRef({
      id: 1031,
      productionOrderCode: 'DS-2026-031',
      color: '卡其色',
      productCode: 'SDQ10070-F26',
      quantity: 220,
    }),
    cropOrderStorage: { cropProcesses: [] },
    tailOrderStorage: {
      cropProcesses: [
        {
          id: 'tail-1031-box-1',
          cropDate: '2026-07-22T10:00:00Z',
          type: 'machine',
          totalQuantity: 24,
          boxWeight: 12.5,
          boxSpecification: {
            id: 'carton-large',
            name: '大箱',
            length: 52,
            width: 34,
            height: 38,
            unit: 'cm',
            type: 'BRAND',
            brand: { id: 1, name: 'SUPERDOWN', customerId: 1 },
          },
          sizeRange: [
            { name: 'XS', cropQuantity: 2 },
            { name: 'S', cropQuantity: 4 },
            { name: 'M', cropQuantity: 8 },
            { name: 'L', cropQuantity: 6 },
            { name: 'XL', cropQuantity: 4 },
          ],
          maintainer: MOCK_USER,
          maintenanceDate: '2026-07-22T10:00:00Z',
        },
        {
          id: 'tail-1031-box-2',
          cropDate: '2026-07-22T14:00:00Z',
          type: 'machine',
          totalQuantity: 16,
          boxWeight: 8.2,
          boxSpecification: {
            id: 'carton-medium',
            name: '中箱',
            length: 45,
            width: 30,
            height: 32,
            unit: 'cm',
            type: 'GENERAL',
          },
          sizeRange: [
            { name: 'XS', cropQuantity: 1 },
            { name: 'S', cropQuantity: 3 },
            { name: 'M', cropQuantity: 5 },
            { name: 'L', cropQuantity: 4 },
            { name: 'XL', cropQuantity: 3 },
          ],
          maintainer: MOCK_USER,
          maintenanceDate: '2026-07-22T14:00:00Z',
        },
      ],
    },
  }),
];

/** 箱规 mock（对齐 GET /api/box_specification/brand；id 与收发 MOCK_CARTON_SPECS 一致） */
const BOX_SPECIFICATION_SEEDS: BoxSpecification[] = [
  {
    id: 'carton-large',
    name: '大箱',
    length: 52,
    width: 34,
    height: 38,
    unit: 'cm',
    type: 'BRAND',
    brand: { id: 1, name: 'SUPERDOWN', customerId: 1 },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
  },
  {
    id: 'carton-medium',
    name: '中箱',
    length: 45,
    width: 30,
    height: 32,
    unit: 'cm',
    type: 'GENERAL',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
  },
  {
    id: 'carton-small',
    name: '小箱',
    length: 38,
    width: 26,
    height: 24,
    unit: 'cm',
    type: 'GENERAL',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
  },
  {
    id: 'carton-apex-large',
    name: 'APEX 大箱',
    length: 50,
    width: 32,
    height: 36,
    unit: 'cm',
    type: 'BRAND',
    brand: { id: 2, name: 'APEX', customerId: 2 },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    user: MOCK_USER,
    lastUpdater: MOCK_USER,
  },
];

const cropStore = new Map<number, CropOrder>(CROP_SEEDS.map((item) => [item.id, item]));
const sewStore = new Map<number, SewOrder>(SEW_SEEDS.map((item) => [item.id, item]));
const tailStore = new Map<number, TailOrder>(TAIL_SEEDS.map((item) => [item.id, item]));
const boxSpecificationStore = [...BOX_SPECIFICATION_SEEDS];

const matchesStatistic = (order: CropOrder, input: CropOrderStatisticInput): boolean => {
  if (input.id != null && order.id !== input.id) return false;
  if (input.productionOrderCode) {
    if (order.productionOrder?.productionOrderCode !== input.productionOrderCode) return false;
  }
  if (input.productCode) {
    if (order.productionOrder?.customerPurchaseOrder?.productCode !== input.productCode) {
      return false;
    }
  }
  if (input.customerPO) {
    if (order.productionOrder?.customerPurchaseOrder?.customerPO !== input.customerPO) {
      return false;
    }
  }
  if (input.color) {
    if (order.productionOrder?.color !== input.color) return false;
  }
  if (input.status?.length) {
    if (!order.status || !input.status.includes(order.status)) return false;
  }
  if (input.cropOrderType && order.cropOrderType !== input.cropOrderType) return false;
  if (input.saleOrderCode) {
    if (order.productionOrder?.saleOrderCode !== input.saleOrderCode) return false;
  }
  return true;
};

const calcStatistic = (orders: CropOrder[], input: CropOrderStatisticInput): CropOrderStatistic => {
  const matched = orders.filter((item) => matchesStatistic(item, input));
  return {
    total: matched.length,
    // mock：self 与 total 相同；接真接口后由后端按当前用户范围回传
    totalSelf: matched.length,
  };
};

const upsertOrder = <T extends CropOrder>(
  store: Map<number, T>,
  input: T,
  cropOrderType: CropOrderType,
): T => {
  const id = input.id > 0 ? input.id : Date.now();
  const existing = store.get(id);
  const next = withStorageTotals({
    ...existing,
    ...input,
    id,
    cropOrderType: input.cropOrderType ?? existing?.cropOrderType ?? cropOrderType,
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
    user: input.user ?? existing?.user ?? MOCK_USER,
    lastUpdater: input.lastUpdater ?? MOCK_USER,
  } as T);
  store.set(id, next);
  return next;
};

const upsertTailOrder = (input: TailOrder): TailOrder => {
  const id = input.id > 0 ? input.id : Date.now();
  const existing = tailStore.get(id);
  const next = withTailStorageTotals({
    ...existing,
    ...input,
    id,
    cropOrderType: input.cropOrderType ?? existing?.cropOrderType ?? 'TAIL_ORDER',
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
    user: input.user ?? existing?.user ?? MOCK_USER,
    lastUpdater: input.lastUpdater ?? MOCK_USER,
  });
  tailStore.set(id, next);
  return next;
};

// —— Crop ——

export const getMockCropOrder = (id: number): CropOrder | null => cropStore.get(id) ?? null;

export const createMockCropOrder = (input: CropOrder): CropOrder =>
  upsertOrder(cropStore, input, 'CROP_ORDER');

export const updateMockCropOrder = (input: CropOrder): CropOrder => {
  if (!input.id || !cropStore.has(input.id)) {
    throw new Error('裁床单不存在');
  }
  return upsertOrder(cropStore, input, 'CROP_ORDER');
};

export const getMockCropOrderStatistic = (
  input: CropOrderStatisticInput = {},
): CropOrderStatistic => calcStatistic([...cropStore.values()], input);

// —— Sew ——

export const getMockSewOrder = (id: number): SewOrder | null => sewStore.get(id) ?? null;

export const createMockSewOrder = (input: SewOrder): SewOrder =>
  upsertOrder(sewStore, input, 'CROP_ORDER');

export const updateMockSewOrder = (input: SewOrder): SewOrder => {
  if (!input.id || !sewStore.has(input.id)) {
    throw new Error('车缝单不存在');
  }
  return upsertOrder(sewStore, input, 'CROP_ORDER');
};

export const getMockSewOrderStatistic = (input: SewOrderStatisticInput = {}): SewOrderStatistic =>
  calcStatistic([...sewStore.values()], input);

// —— Tail ——

export const getMockTailOrder = (id: number): TailOrder | null => tailStore.get(id) ?? null;

export const createMockTailOrder = (input: TailOrder): TailOrder => upsertTailOrder(input);

export const updateMockTailOrder = (input: TailOrder): TailOrder => {
  if (!input.id || !tailStore.has(input.id)) {
    throw new Error('尾部单不存在');
  }
  return upsertTailOrder(input);
};

export const getMockTailOrderStatistic = (
  input: TailOrderStatisticInput = {},
): TailOrderStatistic => calcStatistic([...tailStore.values()], input);

// —— Box specification ——

export const getMockBoxSpecificationsByBrand = (
  brandId: number,
  includeGeneral = true,
): BoxSpecification[] =>
  boxSpecificationStore.filter((item) => {
    const isGeneral = item.type === 'GENERAL' || !item.brand;
    if (isGeneral) return includeGeneral;
    return item.brand?.id === brandId;
  });

export const listMockCropOrders = () => [...cropStore.values()];
export const listMockSewOrders = () => [...sewStore.values()];
export const listMockTailOrders = () => [...tailStore.values()];
export const listMockBoxSpecifications = () => [...boxSpecificationStore];
