import {
  EXCEPTION_MODULE_LABELS,
  FIXED_DATA_PACKAGE_MATERIALS,
  FIXED_PACKAGING_MATERIALS,
} from '@/constants/receiving';
import type {
  MaterialConfirmationData,
  MaterialItem,
  MaterialItemStatus,
  MaterialModuleStatus,
} from '@/types/receiving';
import type {
  ConfirmArriveCommonMaterialInput,
  ConfirmArriveMaterialInput,
  ProductionOrderSupplierDetail,
  ReceiveMaterialStatus,
  SupplierBomItem,
  SupplierMaterialPackage,
} from '@/types/supplierProductionOrder';
import { encodeProductionColorId } from '@/utils/receiving/productionColorId';

export const mapReceiveStatusToItemStatuses = (
  status?: ReceiveMaterialStatus,
): MaterialItemStatus[] => (status === 'Arrived' ? ['arrived'] : ['pending']);

/** schema 无整单领料状态字段，按物料明细到料比例推导 */
export const mapFactoryReceiveToMaterialModule = (
  items: MaterialItem[],
  hasPendingException = false,
): MaterialModuleStatus => {
  if (hasPendingException) return 'exception';
  if (items.length === 0) return 'pending';

  const arrived = items.filter((item) => item.statuses.includes('arrived')).length;
  if (arrived === 0) return 'pending';
  return arrived === items.length ? 'all_arrived' : 'partial';
};

const bomItemId = (id: number) => `bom-${id}`;

/** 后端返回名称可能是简写，映射到固定清单名称 */
const FIXED_NAME_ALIASES: Record<string, string> = {
  主唛: '主唛、码唛、洗水唛',
  码唛: '主唛、码唛、洗水唛',
  洗水唛: '主唛、码唛、洗水唛',
  生产要求: '做货要求',
};

const normalizeMaterialName = (name: string) => FIXED_NAME_ALIASES[name] ?? name;

const findApiMaterialByName = (
  list: SupplierMaterialPackage[] | undefined,
  name: string,
): SupplierMaterialPackage | undefined =>
  list?.find((item) => normalizeMaterialName(item.name) === name);

const buildFixedMaterialItems = (
  catalog: readonly { id: string; name: string }[],
  category: 'packaging' | 'data_package',
  groupName: string,
  apiList: SupplierMaterialPackage[] | undefined,
  quantity?: string,
): MaterialItem[] =>
  catalog.map((entry) => {
    const matched = findApiMaterialByName(apiList, entry.name);
    return {
      id: entry.id,
      category,
      groupName,
      name: entry.name,
      ...(quantity ? { quantity } : {}),
      statuses: mapReceiveStatusToItemStatuses(matched?.receiveMaterialStatus),
    };
  });

/** 数量与幅宽共用 bomItem.unit */
const resolveBomUnit = (item: SupplierBomItem): string | undefined => {
  const label = [item.unit?.unit, item.unit?.name].find((value) => Boolean(value?.trim()));
  return label?.trim();
};

export const mapBomItemToMaterialItem = (item: SupplierBomItem): MaterialItem => {
  const color = item.materialColor ?? item.material?.color;
  const quantity = item.meters ?? item.usage ?? item.formula;
  const unit = resolveBomUnit(item);
  return {
    id: bomItemId(item.id),
    category: 'fabric',
    groupName: item.type ?? item.category ?? '面辅料',
    name: item.name ?? item.material?.name ?? '未命名物料',
    ...(color ? { color } : {}),
    ...(quantity ? { quantity } : {}),
    ...(unit ? { unit } : {}),
    ...(item.width ? { width: item.width } : {}),
    ...(item.supplierName ? { supplier: item.supplierName } : {}),
    statuses: mapReceiveStatusToItemStatuses(item.receiveMaterialStatus),
  };
};

/** 包装辅料 / 资料包始终用前端固定清单；状态尽量按名称对齐后端返回 */
export const mapDetailToMaterialItems = (detail: ProductionOrderSupplierDetail): MaterialItem[] => [
  ...(detail.bomItems ?? []).map(mapBomItemToMaterialItem),
  ...buildFixedMaterialItems(
    FIXED_PACKAGING_MATERIALS,
    'packaging',
    '包装辅料',
    detail.packMaterials,
    '要求足量',
  ),
  ...buildFixedMaterialItems(
    FIXED_DATA_PACKAGE_MATERIALS,
    'data_package',
    '资料包',
    detail.materialPackages,
  ),
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
    productionColorId: encodeProductionColorId(detail),
    items,
    ...progress,
  };
};

export const buildConfirmArriveMaterialInput = (
  detail: ProductionOrderSupplierDetail,
  selectedItemIds: string[],
): ConfirmArriveMaterialInput => {
  const idSet = new Set(selectedItemIds);
  const nextStatus = (selected: boolean, current?: ReceiveMaterialStatus): ReceiveMaterialStatus =>
    selected ? 'Arrived' : (current ?? 'Pending');

  const buildFixedCommon = (
    catalog: readonly { id: string; name: string }[],
    apiList: SupplierMaterialPackage[] | undefined,
  ): ConfirmArriveCommonMaterialInput[] =>
    catalog.map((entry) => {
      const matched = findApiMaterialByName(apiList, entry.name);
      return {
        id: matched?.id ?? entry.id,
        name: entry.name,
        ...(matched?.remark ? { remark: matched.remark } : {}),
        receiveMaterialStatus: nextStatus(idSet.has(entry.id), matched?.receiveMaterialStatus),
      };
    });

  return {
    bomItems: (detail.bomItems ?? []).map((item) => ({
      id: item.id,
      ...(item.name ? { name: item.name } : {}),
      receiveMaterialStatus: nextStatus(idSet.has(bomItemId(item.id)), item.receiveMaterialStatus),
    })),
    packMaterials: buildFixedCommon(FIXED_PACKAGING_MATERIALS, detail.packMaterials),
    materialPackages: buildFixedCommon(FIXED_DATA_PACKAGE_MATERIALS, detail.materialPackages),
  };
};

/** 物料异常 moduleExtend：含物料名称供 web 直接展示，无需再按 id 反查 */
export const buildMaterialExceptionModuleExtend = (params: {
  items: { id: string; name: string }[];
  description: string;
}): Record<string, unknown> => {
  const description = params.description.trim();
  const relatedItems = params.items.map((item) => ({ id: item.id, name: item.name }));
  return {
    moduleLabel: EXCEPTION_MODULE_LABELS.material,
    relatedItemIds: relatedItems.map((item) => item.id),
    relatedItems,
    description,
    // 兼容旧读取路径
    reportContent: description,
  };
};

/** 裁床异常 moduleExtend */
export const buildCuttingExceptionModuleExtend = (params: {
  description: string;
}): Record<string, unknown> => {
  const description = params.description.trim();
  return {
    moduleLabel: EXCEPTION_MODULE_LABELS.cutting,
    description,
    reportContent: description,
  };
};
