import type {
  FactoryException,
  MaterialConfirmationData,
  MaterialItem,
  MaterialItemStatus,
  MaterialModuleStatus,
  ModuleStatusSummary,
  ProductionColorDetail,
  ProductionColorSummary,
} from '@/types/receiving';
import type {
  ConfirmArriveMaterialInput,
  ProductionOrderSupplierDetail,
  ProductionOrderSupplierSearchRecord,
  ReceiveMaterialStatus,
  SupplierBomItem,
  SupplierExceptionRecord,
  SupplierMaterialPackage,
} from '@/types/supplierProductionOrder';

const emptyModuleStatus = (): ModuleStatusSummary => ({
  material: 'pending',
  cutting: { cutTotal: 0, hasException: false },
  sewing: { upTotal: 0, downTotal: 0 },
  packing: { boxCount: 0, pieceCount: 0 },
});

const formatUserName = (user?: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): string => {
  const name = `${user?.lastName ?? ''}${user?.firstName ?? ''}`.trim();
  return name.length > 0 ? name : (user?.username ?? '未知');
};

const formatDate = (value?: string): string => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10).replace(/-/g, '/');
  }
  return value;
};

const formatDateTime = (value?: string): string => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
};

export const mapReceiveStatusToItemStatuses = (
  status?: ReceiveMaterialStatus,
): MaterialItemStatus[] => {
  switch (status) {
    case 'ARRIVED':
      return ['arrived'];
    case 'SHORTAGE':
      return ['shortage'];
    case 'QUALITY_ISSUE':
      return ['quality_issue'];
    case 'PENDING':
    default:
      return ['pending'];
  }
};

export const mapFactoryReceiveToMaterialModule = (
  status?: string,
  hasPendingException = false,
): MaterialModuleStatus => {
  if (hasPendingException) return 'exception';
  if (status === 'COMPLETE') return 'all_arrived';
  if (status === 'PART') return 'partial';
  return 'pending';
};

const bomItemId = (id: number) => `bom-${id}`;
const packItemId = (id: string) => `pack-${id}`;
const packageItemId = (id: string) => `pkg-${id}`;

export const mapBomItemToMaterialItem = (item: SupplierBomItem): MaterialItem => {
  const color = item.materialColor ?? item.material?.color;
  const quantity = item.meters ?? item.usage ?? item.formula;
  return {
    id: bomItemId(item.id),
    category: 'fabric',
    groupName: item.type ?? item.category ?? '面辅料',
    name: item.name ?? item.material?.name ?? '未命名物料',
    ...(color ? { color } : {}),
    ...(quantity ? { quantity } : {}),
    ...(item.width ? { width: item.width } : {}),
    ...(item.supplierName ? { supplier: item.supplierName } : {}),
    statuses: mapReceiveStatusToItemStatuses(item.receiveMaterialStatus),
  };
};
export const mapPackMaterialToMaterialItem = (item: SupplierMaterialPackage): MaterialItem => ({
  id: packItemId(item.id),
  category: 'packaging',
  groupName: '包装辅料',
  name: item.name,
  ...(item.remark ? { quantity: item.remark } : {}),
  statuses: mapReceiveStatusToItemStatuses(item.receiveMaterialStatus),
});

export const mapMaterialPackageToMaterialItem = (item: SupplierMaterialPackage): MaterialItem => ({
  id: packageItemId(item.id),
  category: 'data_package',
  groupName: '资料包',
  name: item.name,
  ...(item.remark ? { quantity: item.remark } : {}),
  statuses: mapReceiveStatusToItemStatuses(item.receiveMaterialStatus),
});

export const mapDetailToMaterialItems = (detail: ProductionOrderSupplierDetail): MaterialItem[] => [
  ...(detail.bomItems ?? []).map(mapBomItemToMaterialItem),
  ...(detail.packMaterials ?? []).map(mapPackMaterialToMaterialItem),
  ...(detail.materialPackages ?? []).map(mapMaterialPackageToMaterialItem),
];

export const calcMaterialProgressFromItems = (items: MaterialItem[]) => {
  const totalCount = items.length;
  const arrivedCount = items.filter((item) => item.statuses.includes('arrived')).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((arrivedCount / totalCount) * 100);
  return { arrivedCount, totalCount, progressPercent };
};

export const mapDetailToMaterialConfirmation = (
  detail: ProductionOrderSupplierDetail,
): MaterialConfirmationData => {
  const items = mapDetailToMaterialItems(detail);
  const progress = calcMaterialProgressFromItems(items);
  return {
    productionColorId: String(detail.id),
    items,
    ...progress,
  };
};

export const mapExceptionRecordToFactoryException = (
  record: SupplierExceptionRecord,
  productionColorId: string,
): FactoryException => {
  const relatedItemIds = Array.isArray(record.moduleExtend?.relatedItemIds)
    ? (record.moduleExtend.relatedItemIds as string[])
    : undefined;
  const module = record.module === 'cutting' || record.module === '裁床' ? 'cutting' : 'material';

  return {
    id: record.id,
    productionColorId,
    module,
    type: record.type,
    status: record.isReplied ? 'replied' : 'pending',
    reporter: formatUserName(record.reporter),
    reportedAt: formatDateTime(record.reportedAt),
    content: relatedItemIds?.length
      ? relatedItemIds.join('、')
      : (record.reportContent?.split('\n')[0] ?? record.type),
    description: record.reportContent ?? '',
    ...(record.replyContent ? { replyContent: record.replyContent } : {}),
    ...(record.repliedAt ? { repliedAt: formatDateTime(record.repliedAt) } : {}),
    ...(relatedItemIds ? { relatedItemIds } : {}),
  };
};

export const mapDetailToFactoryExceptions = (
  detail: ProductionOrderSupplierDetail,
  module?: 'material' | 'cutting',
): FactoryException[] => {
  const productionColorId = String(detail.id);
  return (detail.exceptionRecords ?? [])
    .map((record) => mapExceptionRecordToFactoryException(record, productionColorId))
    .filter((item) => (module ? item.module === module : true));
};

export const mapDetailToProductionColorDetail = (
  detail: ProductionOrderSupplierDetail,
): ProductionColorDetail => {
  const imageUrls = detail.templateDesign?.designImageUrls ?? [];
  const hasPendingException = (detail.exceptionRecords ?? []).some(
    (item) =>
      (item.module === 'material' || item.module === '物料' || item.module === '物料齐套') &&
      !item.isReplied,
  );
  const materialModule = mapFactoryReceiveToMaterialModule(
    detail.factoryReceiveMaterialStatus,
    hasPendingException,
  );
  const finished = detail.status === 'Finished';

  return {
    id: String(detail.id),
    productionOrderCode: detail.productionOrderCode,
    productCode:
      detail.customerPurchaseOrder?.productCode ?? detail.templateDesign?.code ?? detail.code ?? '',
    customerPO: detail.customerPurchaseOrder?.customerPO ?? '',
    brand: detail.customerPurchaseOrder?.brand?.name ?? detail.templateDesign?.brand?.name ?? '',
    color: detail.color,
    ...(detail.customerPurchaseOrder?.colorCode
      ? { colorCode: detail.customerPurchaseOrder.colorCode }
      : {}),
    ...(imageUrls[0] ? { thumbnailUrl: imageUrls[0] } : {}),
    imageUrls,
    status: finished ? 'completed' : 'active',
    moduleStatus: {
      ...emptyModuleStatus(),
      material: materialModule,
      cutting: {
        cutTotal: 0,
        hasException: (detail.exceptionRecords ?? []).some(
          (item) => (item.module === 'cutting' || item.module === '裁床') && !item.isReplied,
        ),
      },
    },
    category: detail.templateDesign?.category ?? detail.type ?? '',
    requiredProductionDate: formatDate(
      detail.customerPurchaseOrder?.requiredProductionDate ?? detail.factoryPlanedProductionDate,
    ),
    code: detail.customerPurchaseOrder?.code ?? detail.code ?? '',
    customerCode: detail.templateDesign?.customerCode ?? '',
    orderType: detail.orderType ?? '',
    productionType: detail.productionType ?? '',
    productionFollowerName: formatUserName(detail.customerPurchaseOrder?.productionFollower),
    quantity: detail.customerPurchaseOrder?.quantity ?? 0,
    sizeRange: (detail.customerPurchaseOrder?.sizeRange ?? []).map((item) => ({
      name: item.name,
      quantity: item.quantity ?? 0,
    })),
    ...(detail.customerPurchaseOrder?.packageAttachment?.length
      ? { packageAttachment: detail.customerPurchaseOrder.packageAttachment }
      : {}),
  };
};

export const mapDetailToProductionColorSummary = (
  detail: ProductionOrderSupplierDetail,
): ProductionColorSummary => {
  const full = mapDetailToProductionColorDetail(detail);
  return {
    id: full.id,
    productionOrderCode: full.productionOrderCode,
    productCode: full.productCode,
    customerPO: full.customerPO,
    brand: full.brand,
    color: full.color,
    ...(full.colorCode ? { colorCode: full.colorCode } : {}),
    ...(full.thumbnailUrl ? { thumbnailUrl: full.thumbnailUrl } : {}),
    imageUrls: full.imageUrls,
    status: full.status,
    moduleStatus: full.moduleStatus,
  };
};

/** 搜索记录按生产色展开为收发搜索结果 */
export const mapSearchRecordsToColorSummaries = (
  records: ProductionOrderSupplierSearchRecord[],
): ProductionColorSummary[] => {
  const results: ProductionColorSummary[] = [];

  for (const record of records) {
    const colors = record.productionOrders ?? [];
    const imageUrls = record.designImageUrls ?? [];
    for (const color of colors) {
      if (color.id == null) continue;
      results.push({
        id: String(color.id),
        productionOrderCode: record.productionOrderCode,
        productCode: record.productCode ?? record.code ?? '',
        customerPO: record.customerPO ?? '',
        brand: record.brand?.name ?? '',
        color: color.color,
        ...(imageUrls[0] ? { thumbnailUrl: imageUrls[0] } : {}),
        imageUrls,
        status: color.status === 'Finished' ? 'completed' : 'active',
        moduleStatus: emptyModuleStatus(),
      });
    }
  }

  return results;
};

/** 根据 UI 选中的物料 id，从详情拼装确认到料入参（仅含选中项） */
export const buildConfirmArriveMaterialInput = (
  detail: ProductionOrderSupplierDetail,
  selectedItemIds: string[],
): ConfirmArriveMaterialInput => {
  const idSet = new Set(selectedItemIds);
  const bomItems = (detail.bomItems ?? []).filter((item) => idSet.has(bomItemId(item.id)));
  const packMaterials = (detail.packMaterials ?? []).filter((item) =>
    idSet.has(packItemId(item.id)),
  );
  const materialPackages = (detail.materialPackages ?? []).filter((item) =>
    idSet.has(packageItemId(item.id)),
  );

  return {
    ...(bomItems.length ? { bomItems } : {}),
    ...(packMaterials.length ? { packMaterials } : {}),
    ...(materialPackages.length ? { materialPackages } : {}),
  };
};

export const buildMaterialExceptionReportContent = (params: {
  itemNames: string[];
  type: string;
  description: string;
}): string => {
  const tag = params.itemNames.join('、');
  const desc = params.description.trim();
  return [`【${params.type}】${tag}`, desc].filter(Boolean).join('\n');
};
