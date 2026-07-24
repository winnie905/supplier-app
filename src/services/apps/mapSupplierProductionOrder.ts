import { MOCK_SUPPLIER_NAME } from '@/services/apps/mockProductionOrders';
import type {
  ProductionOrderAggregateStatus,
  ProductionOrderListResult,
  ProductionOrderTab,
  ProductionOrderTabStat,
  ProductionOrderView,
} from '@/types/apps';
import {
  type Brand,
  MaterialBulkPurchaseOrderStatus,
  OrderStatus,
  ProductionOrderStatus,
  type ProductionOrderVO,
  ProductionStatus,
  type TemplateDesign,
  type User,
} from '@/types/productionOrder';
import type {
  ProductionOrderSupplierCount,
  ProductionOrderSupplierDetail,
  ProductionOrderSupplierSearchRecord,
  SupplierProductionOrderStatus,
} from '@/types/supplierProductionOrder';

const emptyUser = (partial?: Partial<User>): User => ({
  username: partial?.username ?? '',
  email: partial?.email ?? '',
  firstName: partial?.firstName ?? '',
  lastName: partial?.lastName ?? '',
  avatar: partial?.avatar ?? '',
  dateOfBirth: '',
  gender: '',
  ...partial,
});

const mapSupplierStatusToAggregate = (status?: string): ProductionOrderAggregateStatus => {
  if (status === 'Finished') return 'completed';
  if (status === 'InProgress') return 'in_progress';
  return 'pending';
};

const mapColorStatusToProductionStatus = (status?: string): ProductionStatus => {
  switch (status) {
    case 'Finished':
      return ProductionStatus.Finished;
    case 'InProgress':
      return ProductionStatus.InProgress;
    case 'PartialComplete':
      return ProductionStatus.PartialComplete;
    case 'Ordered':
      return ProductionStatus.Ordered;
    case 'Pending':
    default:
      return ProductionStatus.Pending;
  }
};

const todayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
};

/** 统计接口 → Tab 数字 */
export const mapStatisticToTabStats = (
  statistic: ProductionOrderSupplierCount,
): Record<ProductionOrderTab, ProductionOrderTabStat> => ({
  pending: {
    orderCount: statistic.pendingCount,
    pieceCount: statistic.pendingQuantity,
  },
  in_progress: {
    orderCount: statistic.inProgressCount,
    pieceCount: statistic.inProgressQuantity,
  },
  completed: {
    orderCount: statistic.finishedCount,
    pieceCount: statistic.finishedQuantity,
  },
  overdue: {
    orderCount: statistic.overTimeCount,
    pieceCount: statistic.overTimeQuantity,
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
  const requiredDate =
    record.requiredProductionDate ??
    record.factoryPlanedProductionDate ??
    colors.reduce((max, item) => {
      const date = item.factoryPlanedProductionDate ?? '';
      return date > max ? date : max;
    }, '');

  const items: ProductionOrderVO[] = colors.map((colorItem, index) => {
    const follower = emptyUser(record.productionFollower);
    return {
      id: colorItem.id ?? index + 1,
      code: colorItem.code ?? record.code ?? '',
      type: colorItem.type ?? record.type ?? '',
      color: colorItem.color,
      purchaseCode: '',
      status: mapColorStatusToProductionStatus(colorItem.status),
      totalOutboundQuantity: 0,
      totalPurchasePrice: 0,
      saleOrderCode: record.saleOrderCode ?? '',
      orderStatus: ProductionOrderStatus.Pending,
      materialStatus: MaterialBulkPurchaseOrderStatus.Pending,
      nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus.Pending,
      productionType: record.productionType ?? '',
      productionOrderCode: record.productionOrderCode,
      comment: '',
      factoryPlanedProductionDate:
        colorItem.factoryPlanedProductionDate ?? record.factoryPlanedProductionDate ?? '',
      factory: { name: MOCK_SUPPLIER_NAME },
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
        color: colorItem.color,
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
        quantity:
          colorItem.quantity ?? Math.round((record.quantity ?? 0) / Math.max(colors.length, 1)),
        customerColor: colorItem.color,
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
        customerCode: record.customerCode ?? '',
        type: record.productionOrderType ?? 'bulk',
        designImageUrls: record.designImageUrls ?? [],
        developmentType: record.productionOrderType ?? 'FOB',
        category: record.category ?? '',
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
      productionOrderCode: record.productionOrderCode,
      comment: '',
      factoryPlanedProductionDate: requiredDate,
      factory: { name: MOCK_SUPPLIER_NAME },
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
        customerCode: record.customerCode ?? '',
        type: record.productionOrderType ?? 'bulk',
        designImageUrls: record.designImageUrls ?? [],
        developmentType: record.productionOrderType ?? 'FOB',
        category: record.category ?? '',
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
    productionOrderCode: record.productionOrderCode,
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

export const mapDetailToProductionOrderVO = (
  detail: ProductionOrderSupplierDetail,
): ProductionOrderVO => {
  const follower = emptyUser(detail.customerPurchaseOrder?.productionFollower);
  const brandSource = detail.customerPurchaseOrder?.brand ?? detail.templateDesign?.brand;
  const brand: Brand | undefined = brandSource
    ? {
        name: brandSource.name,
        customerId: brandSource.customerId ?? 0,
        ...(brandSource.id != null ? { id: brandSource.id } : {}),
      }
    : undefined;

  const templateDesign: TemplateDesign = {
    customerCode: detail.templateDesign?.customerCode ?? '',
    type: detail.templateDesign?.type ?? 'bulk',
    designImageUrls: detail.templateDesign?.designImageUrls ?? [],
    developmentType: detail.orderType ?? 'FOB',
    category: detail.templateDesign?.category ?? '',
    ...(detail.templateDesign?.code != null ? { code: detail.templateDesign.code } : {}),
    ...(brand ? { brand } : {}),
  };

  return {
    id: detail.id,
    code: detail.code ?? '',
    type: detail.type ?? '',
    color: detail.color,
    purchaseCode: detail.purchaseCode ?? '',
    status: mapColorStatusToProductionStatus(detail.status),
    totalOutboundQuantity: 0,
    totalPurchasePrice: 0,
    saleOrderCode: detail.saleOrderCode ?? '',
    orderStatus: ProductionOrderStatus.Pending,
    materialStatus: MaterialBulkPurchaseOrderStatus.Pending,
    nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus.Pending,
    productionType: detail.productionType ?? '',
    productionOrderCode: detail.productionOrderCode,
    comment: detail.comment ?? '',
    factoryPlanedProductionDate: detail.factoryPlanedProductionDate ?? '',
    factory: {
      name: detail.factory?.name ?? MOCK_SUPPLIER_NAME,
      ...(detail.factory?.id != null ? { id: detail.factory.id } : {}),
      ...(detail.factory?.fullName != null ? { fullName: detail.factory.fullName } : {}),
      ...(detail.factory?.phone != null ? { phone: detail.factory.phone } : {}),
      ...(detail.factory?.contact != null ? { contact: detail.factory.contact } : {}),
    },
    receiveWarehouse: {
      name: detail.receiveWarehouse?.name ?? '',
      ...(detail.receiveWarehouse?.id != null ? { id: detail.receiveWarehouse.id } : {}),
      ...(detail.receiveWarehouse?.contact != null
        ? { contact: detail.receiveWarehouse.contact }
        : {}),
      ...(detail.receiveWarehouse?.phone != null ? { phone: detail.receiveWarehouse.phone } : {}),
    },
    rmbUnitPrice: 0,
    rmbPrice: 0,
    externalRmbUnitPrice: 0,
    externalRmbPrice: 0,
    externalUnitPrice: 0,
    externalPrice: 0,
    secondaryProcessPrice: 0,
    externalCurrency: 'CNY',
    externalCurrencyRate: 1,
    orderType: detail.orderType ?? 'FOB',
    createdAt: detail.createdAt ?? '',
    updatedAt: detail.updatedAt ?? '',
    customerPurchaseOrder: {
      saleOrderCode: detail.customerPurchaseOrder?.saleOrderCode ?? '',
      ingredient: '',
      colorCode: detail.customerPurchaseOrder?.colorCode ?? '',
      code: detail.customerPurchaseOrder?.code ?? detail.code ?? '',
      type: detail.customerPurchaseOrder?.type ?? detail.type ?? '',
      color: detail.customerPurchaseOrder?.color ?? detail.color,
      saleOrderDate: '',
      purchaseCode: detail.purchaseCode ?? '',
      unitPrice: 0,
      rmbUnitPrice: 0,
      isUnderApproval: false,
      currencyRate: 1,
      currency: 'CNY',
      refPurchaseCode: '',
      customerPO: detail.customerPurchaseOrder?.customerPO ?? '',
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
      productCode: detail.customerPurchaseOrder?.productCode ?? '',
      sizeRange: (detail.customerPurchaseOrder?.sizeRange ?? []).map((item) => ({
        name: item.name,
        ...(item.quantity != null ? { quantity: item.quantity } : {}),
        ...(item.outboundQuantity != null ? { outboundQuantity: item.outboundQuantity } : {}),
      })),
      quantity: detail.customerPurchaseOrder?.quantity ?? 0,
      customerColor: detail.customerPurchaseOrder?.color ?? detail.color,
      quoteStatus: OrderStatus.OrderCreated,
      saleOrderStatus: OrderStatus.OrderCreated,
      productionOrderStatus: OrderStatus.OrderCreated,
      requiredProductionDate: detail.customerPurchaseOrder?.requiredProductionDate ?? '',
      createdAt: detail.createdAt ?? '',
      updatedAt: detail.updatedAt ?? '',
      businessFollower: emptyUser(detail.customerPurchaseOrder?.businessFollower),
      department: { id: '', name: '', parentId: null, type: '' },
      group: { id: '', name: '', parentId: null, type: '' },
      productionFollower: follower,
      brand: brand ?? { name: '', customerId: 0 },
    },
    templateDesign,
    shipInformation: '',
    cropOrder: {},
    template: {},
    user: follower,
    lastUpdater: follower,
    bomItems: (detail.bomItems ?? []).map((item) => ({
      id: item.id,
      name: item.name ?? item.material?.name ?? '',
      type: item.type ?? '',
      magnification: 0,
      price: 0,
      unitPrice: 0,
      ...(item.material?.id != null ? { materialId: item.material.id } : {}),
      ...(item.material?.code != null ? { materialCode: item.material.code } : {}),
      ...(item.materialColor != null ? { materialColor: item.materialColor } : {}),
      ...(item.supplierName != null ? { supplierName: item.supplierName } : {}),
    })),
    productionProcesses: [],
    secondaryProcesses: [],
  };
};

export const buildListResultFromSearchAndStatistic = (params: {
  records: ProductionOrderSupplierSearchRecord[];
  statistic: ProductionOrderSupplierCount;
  tab: ProductionOrderTab;
  sort: 'asc' | 'desc';
}): ProductionOrderListResult => {
  const today = todayString();
  let orders = params.records.map((record) => mapSearchRecordToOrderView(record, today));

  orders = orders.filter((order) => {
    if (params.tab === 'overdue') return order.overdue;
    return order.status === params.tab;
  });

  orders.sort((a, b) => {
    const cmp = a.lastDeliveryDate.localeCompare(b.lastDeliveryDate);
    return params.sort === 'asc' ? cmp : -cmp;
  });

  const tabStats = mapStatisticToTabStats(params.statistic);
  const totalOrderCount =
    params.statistic.pendingCount +
    params.statistic.inProgressCount +
    params.statistic.finishedCount;

  return {
    supplierName: MOCK_SUPPLIER_NAME,
    totalOrderCount,
    orders,
    tabStats,
  };
};
