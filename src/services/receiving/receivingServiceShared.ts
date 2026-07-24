import { productionOrderService } from '@/services/apps/productionOrderService';
import {
  createDefaultMaterialItems,
  getProductionColorById,
} from '@/services/receiving/mockCatalog';
import type { WorkshopProductionOrderRef } from '@/types/cropOrder';
import type {
  MaterialItem,
  MaterialModuleStatus,
  ProductionColorDetail,
  ReceivingPersistedState,
  SizeQuantity,
} from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';
import type { ProductionOrderSupplierDetail } from '@/types/supplierProductionOrder';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

/** 会话内缓存：生产色数字 id → 供应商详情 */
const supplierDetailCache = new Map<string, ProductionOrderSupplierDetail>();

export const isSupplierProductionId = (id: string) => /^\d+$/.test(id);

export const cacheSupplierDetail = (detail: ProductionOrderSupplierDetail) => {
  supplierDetailCache.set(String(detail.id), detail);
  return detail;
};

export const resolveSupplierDetail = async (
  productionColorId: string,
): Promise<ProductionOrderSupplierDetail | null> => {
  const cached = supplierDetailCache.get(productionColorId);
  if (cached) return cached;
  if (!isSupplierProductionId(productionColorId)) return null;
  try {
    const detail = await productionOrderService.getDetailById(Number(productionColorId));
    return cacheSupplierDetail(detail);
  } catch {
    return null;
  }
};

/** 同屏并发 getDetail 合并为一次；提交后仍会走新的请求 */
const freshDetailInflight = new Map<string, Promise<ProductionOrderSupplierDetail>>();

export const fetchFreshSupplierDetail = async (
  supplierDetail: ProductionOrderSupplierDetail,
): Promise<ProductionOrderSupplierDetail> => {
  const key = `${supplierDetail.productionOrderCode}::${supplierDetail.color}`;
  const existing = freshDetailInflight.get(key);
  if (existing) return existing;

  const promise = productionOrderService
    .getDetail({
      productionOrderCode: supplierDetail.productionOrderCode,
      color: supplierDetail.color,
    })
    .then((fresh) => cacheSupplierDetail(fresh))
    .finally(() => {
      freshDetailInflight.delete(key);
    });

  freshDetailInflight.set(key, promise);
  return promise;
};

export const toWorkshopProductionRef = (
  detail: ProductionOrderSupplierDetail,
): WorkshopProductionOrderRef => {
  const ref: WorkshopProductionOrderRef = {
    id: detail.id,
    productionOrderCode: detail.productionOrderCode,
    color: detail.color,
    status: detail.status,
  };
  if (detail.code != null) ref.code = detail.code;
  if (detail.type != null) ref.type = detail.type;
  if (detail.saleOrderCode != null) ref.saleOrderCode = detail.saleOrderCode;
  if (detail.factoryPlanedProductionDate != null) {
    ref.factoryPlanedProductionDate = detail.factoryPlanedProductionDate;
  }
  if (detail.customerPurchaseOrder) {
    const cpo = detail.customerPurchaseOrder;
    const mapped: NonNullable<WorkshopProductionOrderRef['customerPurchaseOrder']> = {};
    if (cpo.saleOrderCode != null) mapped.saleOrderCode = cpo.saleOrderCode;
    if (cpo.productCode != null) mapped.productCode = cpo.productCode;
    if (cpo.customerPO != null) mapped.customerPO = cpo.customerPO;
    if (cpo.color != null) mapped.color = cpo.color;
    if (cpo.quantity != null) mapped.quantity = cpo.quantity;
    if (cpo.sizeRange != null) mapped.sizeRange = cpo.sizeRange;
    if (cpo.requiredProductionDate != null) {
      mapped.requiredProductionDate = cpo.requiredProductionDate;
    }
    if (cpo.brand != null) mapped.brand = cpo.brand;
    ref.customerPurchaseOrder = mapped;
  }
  if (detail.templateDesign) {
    const td = detail.templateDesign;
    const mapped: NonNullable<WorkshopProductionOrderRef['templateDesign']> = {};
    if (td.code != null) mapped.code = td.code;
    if (td.category != null) mapped.category = td.category;
    if (td.designImageUrls != null) mapped.designImageUrls = td.designImageUrls;
    if (td.brand != null) mapped.brand = td.brand;
    ref.templateDesign = mapped;
  }
  return ref;
};

export const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const todayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const yesterdayString = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const emptySizeQuantities = (sizes: string[]): SizeQuantity[] =>
  sizes.map((size) => ({ size, quantity: 0 }));

export const sumQuantities = (items: SizeQuantity[]) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0);

const calcMaterialModuleStatus = (
  items: MaterialItem[],
  hasException: boolean,
): MaterialModuleStatus => {
  if (hasException) return 'exception';
  const arrived = items.filter((item) => item.statuses.includes('arrived')).length;
  if (arrived === 0) return 'pending';
  if (arrived === items.length) return 'all_arrived';
  return 'partial';
};

export const ensureMaterialItems = (
  state: ReceivingPersistedState,
  productionColorId: string,
): MaterialItem[] => {
  state.materialItems[productionColorId] ??= createDefaultMaterialItems(productionColorId);
  return state.materialItems[productionColorId];
};

export const seedInitialRecords = (state: ReceivingPersistedState, productionColorId: string) => {
  const detail = getProductionColorById(productionColorId);
  if (!detail) return;

  ensureMaterialItems(state, productionColorId);

  if (productionColorId === 'pc-cutting' && !state.cuttingBeds[productionColorId]?.length) {
    state.cuttingBeds[productionColorId] = [
      {
        id: createId('bed'),
        bedNo: 1,
        bundleCount: 12.5,
        sizeQuantities: [
          { size: 'XS', quantity: 27 },
          { size: 'S', quantity: 24 },
          { size: 'M', quantity: 30 },
          { size: 'L', quantity: 18 },
          { size: 'XL', quantity: 12 },
        ],
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
    ];
  }

  if (
    productionColorId === 'pc-cutting-exception' &&
    !state.exceptions.some(
      (e) => e.productionColorId === productionColorId && e.module === 'cutting',
    )
  ) {
    state.exceptions.push({
      id: createId('exc'),
      productionColorId,
      module: 'cutting',
      type: '裁数不足',
      status: 'pending',
      reporter: '张师傅',
      reportedAt: '2024/05/20 14:30',
      content: '裁床异常',
      description: 'XS码裁数偏少',
    });
  }

  if (
    productionColorId === 'pc-material-exception-pending' &&
    !state.exceptions.some(
      (e) => e.productionColorId === productionColorId && e.module === 'material',
    )
  ) {
    state.exceptions.push({
      id: createId('exc'),
      productionColorId,
      module: 'material',
      type: '缺料',
      status: 'pending',
      reporter: '李仓管',
      reportedAt: '2024/05/19 10:20',
      content: '隐形拉链',
      description: '供应商缺货，预计3天后到',
      relatedItemIds: [`${productionColorId}-fabric-3`],
    });
  }

  if (
    productionColorId === 'pc-material-exception-replied' &&
    !state.exceptions.some(
      (e) => e.productionColorId === productionColorId && e.module === 'material',
    )
  ) {
    state.exceptions.push({
      id: createId('exc'),
      productionColorId,
      module: 'material',
      type: '质量问题',
      status: 'replied',
      reporter: '王质检',
      reportedAt: '2024/05/18 09:15',
      content: '弹力里布',
      description: '色差偏大',
      replyContent: '已协调供应商换货，预计明日到厂',
      repliedAt: '2024/05/18 16:40',
      relatedItemIds: [`${productionColorId}-fabric-2`],
    });
  }

  if (productionColorId === 'pc-sewing-today' && !state.sewingRecords[productionColorId]?.length) {
    state.sewingRecords[productionColorId] = [
      {
        id: createId('sew'),
        date: todayString(),
        upQuantities: [
          { size: 'XS', quantity: 20 },
          { size: 'S', quantity: 30 },
          { size: 'M', quantity: 40 },
          { size: 'L', quantity: 20 },
          { size: 'XL', quantity: 10 },
        ],
        downQuantities: [
          { size: 'XS', quantity: 15 },
          { size: 'S', quantity: 25 },
          { size: 'M', quantity: 30 },
          { size: 'L', quantity: 10 },
          { size: 'XL', quantity: 0 },
        ],
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
    ];
  }

  if (
    productionColorId === 'pc-sewing-history' &&
    !state.sewingRecords[productionColorId]?.length
  ) {
    state.sewingRecords[productionColorId] = [
      {
        id: createId('sew'),
        date: todayString(),
        upQuantities: emptySizeQuantities(sizeNamesFromRange(detail.sizeRange)),
        downQuantities: emptySizeQuantities(sizeNamesFromRange(detail.sizeRange)),
        submitted: false,
      },
      {
        id: createId('sew'),
        date: yesterdayString(),
        upQuantities: [
          { size: 'XS', quantity: 30 },
          { size: 'S', quantity: 40 },
          { size: 'M', quantity: 50 },
          { size: 'L', quantity: 30 },
          { size: 'XL', quantity: 20 },
        ],
        downQuantities: [
          { size: 'XS', quantity: 25 },
          { size: 'S', quantity: 35 },
          { size: 'M', quantity: 45 },
          { size: 'L', quantity: 25 },
          { size: 'XL', quantity: 15 },
        ],
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
    ];
  }

  if (productionColorId === 'pc-packing' && !state.packingBoxes[productionColorId]?.length) {
    state.packingBoxes[productionColorId] = [
      {
        id: createId('box'),
        boxNo: 1,
        cartonSpecId: 'carton-large',
        weightKg: 13,
        sizeQuantities: [
          { size: 'XS', quantity: 10 },
          { size: 'S', quantity: 20 },
          { size: 'M', quantity: 30 },
          { size: 'L', quantity: 20 },
          { size: 'XL', quantity: 10 },
        ],
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
      {
        id: createId('box'),
        boxNo: 2,
        cartonSpecId: 'carton-medium',
        weightKg: 10,
        sizeQuantities: [
          { size: 'XS', quantity: 8 },
          { size: 'S', quantity: 16 },
          { size: 'M', quantity: 24 },
          { size: 'L', quantity: 12 },
          { size: 'XL', quantity: 0 },
        ],
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
    ];
  }
};

const buildModuleStatus = (
  state: ReceivingPersistedState,
  detail: ProductionColorDetail,
): ProductionColorDetail['moduleStatus'] => {
  const items = ensureMaterialItems(state, detail.id);
  const materialExceptions = state.exceptions.filter(
    (e) => e.productionColorId === detail.id && e.module === 'material' && e.status === 'pending',
  );
  const cuttingExceptions = state.exceptions.filter(
    (e) => e.productionColorId === detail.id && e.module === 'cutting' && e.status === 'pending',
  );

  const beds = state.cuttingBeds[detail.id] ?? [];
  const cutTotal = beds
    .filter((bed) => bed.submitted)
    .reduce((total, bed) => total + sumQuantities(bed.sizeQuantities), 0);

  const sewingRecords = state.sewingRecords[detail.id] ?? [];
  const upTotal = sewingRecords
    .filter((r) => r.submitted)
    .reduce((total, r) => total + sumQuantities(r.upQuantities), 0);
  const downTotal = sewingRecords
    .filter((r) => r.submitted)
    .reduce((total, r) => total + sumQuantities(r.downQuantities), 0);

  const boxes = state.packingBoxes[detail.id] ?? [];
  const submittedBoxes = boxes.filter((b) => b.submitted);
  const pieceCount = submittedBoxes.reduce(
    (total, box) => total + sumQuantities(box.sizeQuantities),
    0,
  );

  return {
    material: calcMaterialModuleStatus(items, materialExceptions.length > 0),
    cutting: { cutTotal, hasException: cuttingExceptions.length > 0 },
    sewing: { upTotal, downTotal },
    packing: { boxCount: submittedBoxes.length, pieceCount },
  };
};

export const enrichDetail = (
  state: ReceivingPersistedState,
  detail: ProductionColorDetail,
): ProductionColorDetail => ({
  ...detail,
  moduleStatus: buildModuleStatus(state, detail),
});

export async function withState<T>(
  fn: (state: ReceivingPersistedState) => T | Promise<T>,
): Promise<T> {
  const state = await loadReceivingState();
  const result = await fn(state);
  await saveReceivingState(state);
  return result;
}
