import {
  createDefaultMaterialItems,
  getProductionColorById,
  getProductionColorByOrderAndColor,
  MOCK_CARTON_SPECS,
  MOCK_PRODUCTION_COLORS,
  toSummary,
} from '@/services/receiving/mockCatalog';
import type {
  CuttingBedRecord,
  CuttingRecordsData,
  ExceptionModule,
  FactoryException,
  MaterialConfirmationData,
  MaterialItem,
  MaterialModuleStatus,
  PackingBoxRecord,
  PackingRecordsData,
  ProductionColorDetail,
  ProductionColorSummary,
  ReceivingPersistedState,
  SewingDayRecord,
  SewingRecordsData,
  SizeQuantity,
} from '@/types/receiving';
import { loadReceivingState, saveReceivingState } from '@/utils/receiving/storage';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const todayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const yesterdayString = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptySizeQuantities = (sizes: string[]): SizeQuantity[] =>
  sizes.map((size) => ({ size, quantity: 0 }));

const sumQuantities = (items: SizeQuantity[]) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0);

const calcMaterialProgress = (items: MaterialItem[]) => {
  const totalCount = items.length;
  const arrivedCount = items.filter((item) => item.statuses.includes('arrived')).length;
  const progressPercent =
    totalCount === 0 ? 0 : Number(((arrivedCount / totalCount) * 100).toFixed(2));
  return { totalCount, arrivedCount, progressPercent };
};

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

const ensureMaterialItems = (
  state: ReceivingPersistedState,
  productionColorId: string,
): MaterialItem[] => {
  state.materialItems[productionColorId] ??= createDefaultMaterialItems(productionColorId);
  return state.materialItems[productionColorId];
};

const seedInitialRecords = (state: ReceivingPersistedState, productionColorId: string) => {
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
        upQuantities: emptySizeQuantities(detail.sizes),
        downQuantities: emptySizeQuantities(detail.sizes),
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

const enrichDetail = (
  state: ReceivingPersistedState,
  detail: ProductionColorDetail,
): ProductionColorDetail => ({
  ...detail,
  moduleStatus: buildModuleStatus(state, detail),
});

async function withState<T>(fn: (state: ReceivingPersistedState) => T | Promise<T>): Promise<T> {
  const state = await loadReceivingState();
  const result = await fn(state);
  await saveReceivingState(state);
  return result;
}

export const receivingService = {
  async getSelectedProductionColor(): Promise<ProductionColorSummary | null> {
    await delay();
    const state = await loadReceivingState();
    if (!state.selectedProductionColorId) return null;
    const detail = getProductionColorById(state.selectedProductionColorId);
    if (!detail) return null;
    seedInitialRecords(state, detail.id);
    await saveReceivingState(state);
    return toSummary(enrichDetail(state, detail));
  },

  async searchProductionColors(keyword: string): Promise<ProductionColorSummary[]> {
    await delay();
    const q = keyword.trim().toLowerCase();
    if (!q) return [];
    const state = await loadReceivingState();
    return MOCK_PRODUCTION_COLORS.filter((item) => {
      const haystack = [item.productionOrderNo, item.bulkStyleNo, item.po, item.brand, item.color]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    }).map((detail) => toSummary(enrichDetail(state, detail)));
  },

  async resolveQrCode(content: string): Promise<ProductionColorDetail | null> {
    await delay();
    const trimmed = content.trim();
    if (!trimmed) return null;

    let detail = getProductionColorById(trimmed);
    if (!detail && trimmed.includes('|')) {
      const [orderNo, color] = trimmed.split('|');
      if (orderNo && color) {
        detail = getProductionColorByOrderAndColor(orderNo.trim(), color.trim());
      }
    }

    return detail ?? null;
  },

  async selectProductionColor(id: string): Promise<ProductionColorSummary> {
    return withState((state) => {
      const detail = getProductionColorById(id);
      if (!detail) throw new Error('生产色不存在');
      state.selectedProductionColorId = id;
      seedInitialRecords(state, id);
      return toSummary(enrichDetail(state, detail));
    });
  },

  async clearSelectedProductionColor(): Promise<void> {
    await withState((state) => {
      state.selectedProductionColorId = null;
    });
  },

  async getProductionColorDetail(id: string): Promise<ProductionColorDetail | null> {
    await delay();
    const state = await loadReceivingState();
    const detail = getProductionColorById(id);
    if (!detail) return null;
    seedInitialRecords(state, id);
    await saveReceivingState(state);
    return enrichDetail(state, detail);
  },

  async getMaterialConfirmation(productionColorId: string): Promise<MaterialConfirmationData> {
    await delay();
    const state = await loadReceivingState();
    const items = ensureMaterialItems(state, productionColorId);
    const { arrivedCount, totalCount, progressPercent } = calcMaterialProgress(items);
    await saveReceivingState(state);
    return { productionColorId, items, arrivedCount, totalCount, progressPercent };
  },

  async getFactoryExceptions(
    productionColorId: string,
    module?: ExceptionModule,
  ): Promise<FactoryException[]> {
    await delay();
    const state = await loadReceivingState();
    return state.exceptions.filter(
      (item) =>
        item.productionColorId === productionColorId && (module ? item.module === module : true),
    );
  },

  async getPendingExceptionCount(
    productionColorId: string,
    module: ExceptionModule,
  ): Promise<number> {
    const list = await this.getFactoryExceptions(productionColorId, module);
    return list.filter((item) => item.status === 'pending').length;
  },

  async submitMaterialArrival(
    productionColorId: string,
    itemIds: string[],
  ): Promise<MaterialConfirmationData> {
    return withState((state) => {
      const items = ensureMaterialItems(state, productionColorId);
      items.forEach((item) => {
        if (itemIds.includes(item.id) && !item.statuses.includes('arrived')) {
          const nextStatuses = item.statuses.filter((s) => s !== 'pending');
          if (!nextStatuses.includes('arrived')) {
            nextStatuses.push('arrived');
          }
          item.statuses = nextStatuses;
        }
      });
      const progress = calcMaterialProgress(items);
      return { productionColorId, items, ...progress };
    });
  },

  async submitMaterialException(input: {
    productionColorId: string;
    itemIds: string[];
    type: string;
    description: string;
  }): Promise<FactoryException> {
    return withState((state) => {
      const items = ensureMaterialItems(state, input.productionColorId);
      const selectedItems = items.filter((item) => input.itemIds.includes(item.id));
      const tag = selectedItems.map((item) => item.name).join('、');

      selectedItems.forEach((item) => {
        if (input.type === '缺料' && !item.statuses.includes('shortage')) {
          item.statuses.push('shortage');
        }
        if (input.type === '质量问题' && !item.statuses.includes('quality_issue')) {
          item.statuses.push('quality_issue');
        }
      });

      const exception: FactoryException = {
        id: createId('exc'),
        productionColorId: input.productionColorId,
        module: 'material',
        type: input.type,
        status: 'pending',
        reporter: '当前用户',
        reportedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        content: tag,
        description: input.description,
        relatedItemIds: input.itemIds,
      };
      state.exceptions.push(exception);
      return exception;
    });
  },

  async getCuttingRecords(productionColorId: string): Promise<CuttingRecordsData> {
    await delay();
    const state = await loadReceivingState();
    const detail = getProductionColorById(productionColorId);
    if (!detail) throw new Error('生产色不存在');
    seedInitialRecords(state, productionColorId);
    state.cuttingBeds[productionColorId] ??= [];
    await saveReceivingState(state);
    return {
      productionColorId,
      beds: state.cuttingBeds[productionColorId],
      ...(state.cuttingEditingBedId[productionColorId]
        ? { editingBedId: state.cuttingEditingBedId[productionColorId] }
        : {}),
      plannedTotal: detail.plannedTotal,
      sizes: detail.sizes,
    };
  },

  async saveCuttingDraft(
    productionColorId: string,
    beds: CuttingBedRecord[],
    editingBedId?: string,
  ): Promise<void> {
    await withState((state) => {
      state.cuttingBeds[productionColorId] = beds;
      state.cuttingEditingBedId[productionColorId] = editingBedId;
    });
  },

  async submitCuttingBed(productionColorId: string, bedId: string): Promise<CuttingBedRecord> {
    return withState((state) => {
      const beds = state.cuttingBeds[productionColorId] ?? [];
      const bed = beds.find((item) => item.id === bedId);
      if (!bed) throw new Error('床次不存在');
      const total = sumQuantities(bed.sizeQuantities);
      if (total <= 0 && bed.bundleCount <= 0) {
        throw new Error('EMPTY_FORM');
      }
      bed.submitted = true;
      bed.submittedAt = new Date().toISOString();
      state.cuttingEditingBedId[productionColorId] = undefined;
      return bed;
    });
  },

  async submitCuttingException(input: {
    productionColorId: string;
    type: string;
    description: string;
  }): Promise<FactoryException> {
    return withState((state) => {
      const exception: FactoryException = {
        id: createId('exc'),
        productionColorId: input.productionColorId,
        module: 'cutting',
        type: input.type,
        status: 'pending',
        reporter: '当前用户',
        reportedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        content: '裁床异常',
        description: input.description,
      };
      state.exceptions.push(exception);
      return exception;
    });
  },

  async getSewingRecords(productionColorId: string): Promise<SewingRecordsData> {
    await delay();
    const state = await loadReceivingState();
    const detail = getProductionColorById(productionColorId);
    if (!detail) throw new Error('生产色不存在');
    seedInitialRecords(state, productionColorId);
    state.sewingRecords[productionColorId] ??= [
      {
        id: createId('sew'),
        date: todayString(),
        upQuantities: emptySizeQuantities(detail.sizes),
        downQuantities: emptySizeQuantities(detail.sizes),
        submitted: false,
      },
    ];
    await saveReceivingState(state);
    return {
      productionColorId,
      records: state.sewingRecords[productionColorId],
      sizes: detail.sizes,
      today: todayString(),
    };
  },

  async saveSewingRecords(productionColorId: string, records: SewingDayRecord[]): Promise<void> {
    await withState((state) => {
      state.sewingRecords[productionColorId] = records;
    });
  },

  async submitSewingRecord(productionColorId: string, recordId: string): Promise<SewingDayRecord> {
    return withState((state) => {
      const records = state.sewingRecords[productionColorId] ?? [];
      const record = records.find((item) => item.id === recordId);
      if (!record) throw new Error('记录不存在');
      const total = sumQuantities(record.upQuantities) + sumQuantities(record.downQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      record.submitted = true;
      record.submittedAt = new Date().toISOString();
      return record;
    });
  },

  async getPackingRecords(productionColorId: string): Promise<PackingRecordsData> {
    await delay();
    const state = await loadReceivingState();
    const detail = getProductionColorById(productionColorId);
    if (!detail) throw new Error('生产色不存在');
    seedInitialRecords(state, productionColorId);
    state.packingBoxes[productionColorId] ??= [];
    await saveReceivingState(state);
    return {
      productionColorId,
      boxes: state.packingBoxes[productionColorId],
      ...(state.packingEditingBoxId[productionColorId]
        ? { editingBoxId: state.packingEditingBoxId[productionColorId] }
        : {}),
      sizes: detail.sizes,
    };
  },

  async savePackingDraft(
    productionColorId: string,
    boxes: PackingBoxRecord[],
    editingBoxId?: string,
  ): Promise<void> {
    await withState((state) => {
      state.packingBoxes[productionColorId] = boxes;
      state.packingEditingBoxId[productionColorId] = editingBoxId;
    });
  },

  async submitPackingBox(productionColorId: string, boxId: string): Promise<PackingBoxRecord> {
    return withState((state) => {
      const boxes = state.packingBoxes[productionColorId] ?? [];
      const box = boxes.find((item) => item.id === boxId);
      if (!box) throw new Error('箱子不存在');
      if (!box.cartonSpecId) throw new Error('NO_CARTON');
      const total = sumQuantities(box.sizeQuantities);
      if (total <= 0) throw new Error('EMPTY_FORM');
      box.submitted = true;
      box.submittedAt = new Date().toISOString();
      state.packingEditingBoxId[productionColorId] = undefined;
      return box;
    });
  },

  getCartonSpecs() {
    return MOCK_CARTON_SPECS;
  },
};

export { emptySizeQuantities, sumQuantities, todayString };
