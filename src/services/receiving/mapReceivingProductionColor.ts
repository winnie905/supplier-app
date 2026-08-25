import { emptyModuleStatus, formatUserName } from '@/services/receiving/mapReceivingHelpers';
import {
  mapDetailToMaterialItems,
  mapFactoryReceiveToMaterialModule,
} from '@/services/receiving/mapReceivingMaterial';
import { mapWorkshopOrdersToModuleStatus } from '@/services/receiving/mapReceivingWorkshop';
import type { ProductionColorDetail, ProductionColorSummary } from '@/types/receiving';
import type {
  ProductionOrderSupplierDetail,
  ProductionOrderSupplierSearchRecord,
} from '@/types/supplierProductionOrder';
import { formatDateSlash } from '@/utils/date';
import { encodeProductionColorId } from '@/utils/receiving/productionColorId';

const urlsFromProductImages = (images?: ({ url?: string | null } | null)[] | null): string[] =>
  (images ?? []).map((item) => item?.url?.trim()).filter((url): url is string => Boolean(url));

export const mapDetailToProductionColorDetail = (
  detail: ProductionOrderSupplierDetail,
): ProductionColorDetail => {
  // Hero：frontImages 优先，再拼 backImages；订单信息卡片缩略图仅用正面首张
  const frontUrls = urlsFromProductImages(detail.template?.frontImages);
  const backUrls = urlsFromProductImages(detail.template?.backImages);
  const imageUrls = [...frontUrls, ...backUrls];
  const hasPendingException = (detail.exceptionRecords ?? []).some(
    (item) =>
      (item.module === 'material' || item.module === '物料' || item.module === '物料齐套') &&
      !item.isReplied,
  );
  const materialModule = mapFactoryReceiveToMaterialModule(
    mapDetailToMaterialItems(detail),
    hasPendingException,
  );
  const finished = detail.status === 'Finished';
  const workshopStatus = mapWorkshopOrdersToModuleStatus(detail);
  const hasCuttingException = (detail.exceptionRecords ?? []).some(
    (item) => (item.module === 'cutting' || item.module === '裁床') && !item.isReplied,
  );

  return {
    id: encodeProductionColorId(detail),
    productionOrderCode: detail.productionOrderCode,
    productCode:
      detail.customerPurchaseOrder?.productCode ?? detail.templateDesign?.code ?? detail.code ?? '',
    customerPO: detail.customerPurchaseOrder?.customerPO ?? '',
    brand: detail.customerPurchaseOrder?.brand?.name ?? detail.templateDesign?.brand?.name ?? '',
    color: detail.color,
    ...(detail.customerPurchaseOrder?.colorCode
      ? { colorCode: detail.customerPurchaseOrder.colorCode }
      : {}),
    ...(frontUrls[0] ? { thumbnailUrl: frontUrls[0] } : {}),
    imageUrls,
    status: finished ? 'completed' : 'active',
    moduleStatus: {
      material: materialModule,
      cutting: {
        cutTotal: workshopStatus.cutting.cutTotal,
        hasException: hasCuttingException,
      },
      sewing: workshopStatus.sewing,
      packing: workshopStatus.packing,
    },
    category: detail.templateDesign?.category ?? detail.type ?? '',
    requiredProductionDate: formatDateSlash(
      detail.customerPurchaseOrder?.requiredProductionDate ?? detail.factoryPlanedProductionDate,
    ),
    code: detail.customerPurchaseOrder?.code ?? detail.code ?? '',
    customerCode:
      [detail.customerCode, detail.templateDesign?.customerCode].find((value) =>
        Boolean(value?.trim()),
      ) ?? '',
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

/**
 * 搜索记录按生产色展开为收发搜索结果。
 * 生产单号缺失的生产色无法回查详情，直接丢弃，否则会拼出重复的 "null::颜色" id。
 */
export const mapSearchRecordsToColorSummaries = (
  records: ProductionOrderSupplierSearchRecord[],
): ProductionColorSummary[] => {
  const results: ProductionColorSummary[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    for (const item of record.productionOrders ?? []) {
      const productionOrderCode = item.productionOrderCode ?? record.productionOrderCode;
      if (!productionOrderCode || !item.color) continue;

      const id = encodeProductionColorId({ productionOrderCode, color: item.color });
      if (seen.has(id)) continue;
      seen.add(id);

      results.push({
        id,
        productionOrderCode,
        productCode: record.productCode ?? '',
        customerPO: record.customerPO ?? '',
        brand: record.brand?.name ?? '',
        color: item.color,
        imageUrls: [],
        status: item.status === 'Finished' ? 'completed' : 'active',
        moduleStatus: emptyModuleStatus(),
      });
    }
  }

  return results;
};

/**
 * 从详情拼装确认到料入参：回传全量物料，勾选项标记为已到料，其余保持原状态。
 * 包装辅料 / 资料包始终按前端固定清单回传。
 */
