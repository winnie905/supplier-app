import {
  emptyUser,
  mapColorStatusToProductionStatus,
  mapSupplierStatusToAggregate,
} from '@/services/apps/mapSupplierProductionOrderHelpers';
import type {
  DeliverySortOrder,
  ProductionOrderListResult,
  ProductionOrderTab,
  ProductionOrderTabStat,
  ProductionOrderView,
} from '@/types/apps';
import {
  MaterialBulkPurchaseOrderStatus,
  OrderStatus,
  ProductionOrderStatus,
  type ProductionOrderVO,
} from '@/types/productionOrder';
import type {
  ProductionOrderSortNode,
  ProductionOrderSupplierCount,
  ProductionOrderSupplierSearchInput,
  ProductionOrderSupplierSearchRecord,
  SupplierProductionOrderStatus,
} from '@/types/supplierProductionOrder';
import { todayString } from '@/utils/date';

/** 统计接口 → Tab 数字 */
export const mapStatisticToTabStats = (
  statistic: ProductionOrderSupplierCount,
): Record<ProductionOrderTab, ProductionOrderTabStat> => ({
  pending: {
    orderCount: statistic.pendingCount ?? 0,
    pieceCount: statistic.pendingQuantity ?? 0,
  },
  in_progress: {
    orderCount: statistic.inProgressCount ?? 0,
    pieceCount: statistic.inProgressQuantity ?? 0,
  },
  completed: {
    orderCount: statistic.finishedCount ?? 0,
    pieceCount: statistic.finishedQuantity ?? 0,
  },
  overdue: {
    orderCount: statistic.overTimeCount ?? 0,
    pieceCount: statistic.overTimeQuantity ?? 0,
  },
});

export const tabToSupplierStatus = (
  tab: ProductionOrderTab,
): SupplierProductionOrderStatus | undefined => {
  switch (tab) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'InProgress';
    case 'completed':
      return 'Finished';
    case 'overdue':
      return undefined;
    default:
      return undefined;
  }
};

/** Tab → 列表查询入参：状态 Tab 传 status，超期 Tab 传 isOverTime */
export const tabToSearchFilter = (
  tab: ProductionOrderTab,
): Pick<ProductionOrderSupplierSearchInput, 'status' | 'isOverTime'> => {
  const status = tabToSupplierStatus(tab);
  if (status) return { status: [status] };
  if (tab === 'overdue') return { isOverTime: true };
  return {};
};

/** 对齐 erp-web `getSortParams`，最后交期排序写入 sortNode */
export const buildLastDeliveryDateSortNode = (
  order: DeliverySortOrder,
): ProductionOrderSortNode => ({
  sort: [{ 'multiColorProductCoreData.factoryPlanedProductionDate': { order } }],
});

/** 搜索选中回填：超期优先进超期 Tab，否则按整单状态 */
export const resolveTabForOrder = (
  order: Pick<ProductionOrderView, 'status' | 'overdue'>,
): ProductionOrderTab => {
  if (order.overdue) return 'overdue';
  return order.status;
};

/** search record → 列表卡片视图 */
export const mapSearchRecordToOrderView = (
  record: ProductionOrderSupplierSearchRecord,
  today = todayString(),
): ProductionOrderView => {
  const colors = record.productionOrders ?? [];
  // 整单生产单号可能为空，退回任一生产色上的单号，避免列表 key 退化成空串
  const productionOrderCode =
    record.productionOrderCode ??
    colors.find((item) => item.productionOrderCode)?.productionOrderCode ??
    '';
  const requiredDate =
    record.factoryPlanedProductionDate ??
    colors.reduce((max, item) => {
      const date = item.factoryPlanedProductionDate ?? '';
      return date > max ? date : max;
    }, '');

  const items: ProductionOrderVO[] = colors.map((colorItem, index) => {
    const follower = emptyUser(record.productionFollower);
    const color = colorItem.color ?? '-';
    return {
      id: index + 1,
      code: colorItem.code ?? record.code ?? '',
      type: colorItem.type ?? record.type ?? '',
      color,
      purchaseCode: '',
      status: mapColorStatusToProductionStatus(colorItem.status),
      totalOutboundQuantity: 0,
      totalPurchasePrice: 0,
      saleOrderCode: record.saleOrderCode ?? '',
      orderStatus: ProductionOrderStatus.Pending,
      materialStatus: MaterialBulkPurchaseOrderStatus.Pending,
      nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus.Pending,
      productionType: record.productionType ?? '',
      productionOrderCode,
      comment: '',
      factoryPlanedProductionDate:
        colorItem.factoryPlanedProductionDate ?? record.factoryPlanedProductionDate ?? '',
      factory: { name: '' },
      receiveWarehouse: { name: '' },
      rmbUnitPrice: 0,
      rmbPrice: 0,
      externalRmbUnitPrice: 0,
      externalRmbPrice: 0,
      externalUnitPrice: 0,
      externalPrice: 0,
      secondaryProcessPrice: 0,
      externalCurrency: 'CNY',
      externalCurrencyRate: 1,
      orderType: record.productionOrderType ?? 'FOB',
      createdAt: '',
      updatedAt: '',
      customerPurchaseOrder: {
        saleOrderCode: record.saleOrderCode ?? '',
        ingredient: '',
        colorCode: '',
        code: record.code ?? '',
        type: record.type ?? '',
        color,
        saleOrderDate: '',
        purchaseCode: '',
        unitPrice: 0,
        rmbUnitPrice: 0,
        isUnderApproval: false,
        currencyRate: 1,
        currency: 'CNY',
        refPurchaseCode: '',
        customerPO: record.customerPO ?? '',
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
        productCode: record.productCode ?? '',
        sizeRange: [],
        quantity: Math.round((record.quantity ?? 0) / Math.max(colors.length, 1)),
        customerColor: color,
        quoteStatus: OrderStatus.OrderCreated,
        saleOrderStatus: OrderStatus.OrderCreated,
        productionOrderStatus: OrderStatus.OrderCreated,
        requiredProductionDate: colorItem.factoryPlanedProductionDate ?? requiredDate,
        createdAt: '',
        updatedAt: '',
        businessFollower: emptyUser(record.businessFollower),
        department: { id: '', name: '', parentId: null, type: '' },
        group: { id: '', name: '', parentId: null, type: '' },
        productionFollower: follower,
        brand: {
          name: record.brand?.name ?? '',
          customerId: record.brand?.customerId ?? 0,
          ...(record.brand?.id != null ? { id: record.brand.id } : {}),
        },
      },
      templateDesign: {
        customerCode:
          [record.customerCode, record.templateDesign?.customerCode].find((value) =>
            Boolean(value?.trim()),
          ) ?? '',
        type: record.productionOrderType ?? 'bulk',
        designImageUrls: [],
        developmentType: record.productionOrderType ?? 'FOB',
        category: record.templateDesign?.category ?? '',
        ...(record.brand
          ? {
              brand: {
                name: record.brand.name,
                customerId: record.brand.customerId ?? 0,
                ...(record.brand.id != null ? { id: record.brand.id } : {}),
              },
            }
          : {}),
      },
      shipInformation: '',
      cropOrder: {},
      template: {},
      user: follower,
      lastUpdater: follower,
      bomItems: [],
      productionProcesses: [],
      secondaryProcesses: [],
    };
  });

  // 若无色明细，造一条代表行，保证卡片可渲染
  if (items.length === 0) {
    const follower = emptyUser(record.productionFollower);
    items.push({
      id: 1,
      code: record.code ?? '',
      type: record.type ?? '',
      color: '-',
      purchaseCode: '',
      status: mapColorStatusToProductionStatus(record.productionOrderStatus),
      totalOutboundQuantity: 0,
      totalPurchasePrice: 0,
      saleOrderCode: record.saleOrderCode ?? '',
      orderStatus: ProductionOrderStatus.Pending,
      materialStatus: MaterialBulkPurchaseOrderStatus.Pending,
      nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus.Pending,
      productionType: record.productionType ?? '',
      productionOrderCode,
      comment: '',
      factoryPlanedProductionDate: requiredDate,
      factory: { name: '' },
      receiveWarehouse: { name: '' },
      rmbUnitPrice: 0,
      rmbPrice: 0,
      externalRmbUnitPrice: 0,
      externalRmbPrice: 0,
      externalUnitPrice: 0,
      externalPrice: 0,
      secondaryProcessPrice: 0,
      externalCurrency: 'CNY',
      externalCurrencyRate: 1,
      orderType: record.productionOrderType ?? 'FOB',
      createdAt: '',
      updatedAt: '',
      customerPurchaseOrder: {
        saleOrderCode: record.saleOrderCode ?? '',
        ingredient: '',
        colorCode: '',
        code: record.code ?? '',
        type: record.type ?? '',
        color: '-',
        saleOrderDate: '',
        purchaseCode: '',
        unitPrice: 0,
        rmbUnitPrice: 0,
        isUnderApproval: false,
        currencyRate: 1,
        currency: 'CNY',
        refPurchaseCode: '',
        customerPO: record.customerPO ?? '',
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
        productCode: record.productCode ?? '',
        sizeRange: [],
        quantity: record.quantity ?? 0,
        customerColor: '-',
        quoteStatus: OrderStatus.OrderCreated,
        saleOrderStatus: OrderStatus.OrderCreated,
        productionOrderStatus: OrderStatus.OrderCreated,
        requiredProductionDate: requiredDate,
        createdAt: '',
        updatedAt: '',
        businessFollower: emptyUser(record.businessFollower),
        department: { id: '', name: '', parentId: null, type: '' },
        group: { id: '', name: '', parentId: null, type: '' },
        productionFollower: follower,
        brand: {
          name: record.brand?.name ?? '',
          customerId: record.brand?.customerId ?? 0,
          ...(record.brand?.id != null ? { id: record.brand.id } : {}),
        },
      },
      templateDesign: {
        customerCode:
          [record.customerCode, record.templateDesign?.customerCode].find((value) =>
            Boolean(value?.trim()),
          ) ?? '',
        type: record.productionOrderType ?? 'bulk',
        designImageUrls: [],
        developmentType: record.productionOrderType ?? 'FOB',
        category: record.templateDesign?.category ?? '',
      },
      shipInformation: '',
      cropOrder: {},
      template: {},
      user: follower,
      lastUpdater: follower,
      bomItems: [],
      productionProcesses: [],
      secondaryProcesses: [],
    });
  }

  const safeRepresentative = items[0]!;
  const safeTotalQty =
    record.quantity ?? items.reduce((sum, item) => sum + item.customerPurchaseOrder.quantity, 0);

  return {
    productionOrderCode,
    representative: safeRepresentative,
    items,
    status: mapSupplierStatusToAggregate(record.productionOrderStatus),
    lastDeliveryDate: requiredDate,
    colorCount: items.length,
    totalQty: safeTotalQty,
    // 超期仅统计未完成订单（已完成不进超期 Tab）
    overdue:
      mapSupplierStatusToAggregate(record.productionOrderStatus) !== 'completed' &&
      Boolean(requiredDate && today > requiredDate),
  };
};

export const mapSearchRecordsToOrders = (
  records: ProductionOrderSupplierSearchRecord[],
): ProductionOrderView[] => {
  const today = todayString();
  return records.map((record) => mapSearchRecordToOrderView(record, today));
};

export const buildTabStatsFromStatistic = (
  statistic: ProductionOrderSupplierCount,
): Pick<ProductionOrderListResult, 'tabStats' | 'totalOrderCount'> => {
  const tabStats = mapStatisticToTabStats(statistic);
  const totalOrderCount =
    Number(tabStats.pending.orderCount ?? 0) +
    Number(tabStats.in_progress.orderCount ?? 0) +
    Number(tabStats.completed.orderCount ?? 0);
  return { tabStats, totalOrderCount };
};
