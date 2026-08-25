/** 订单查询 mapper 入口：按 list / detail / helpers 拆分后在此 re-export */
export { mapDetailToProductionOrderVO } from '@/services/apps/mapSupplierProductionOrderDetail';
export {
  emptyUser,
  mapColorStatusToProductionStatus,
  mapSupplierStatusToAggregate,
} from '@/services/apps/mapSupplierProductionOrderHelpers';
export {
  buildTabStatsFromStatistic,
  mapSearchRecordsToSortedOrders,
  mapSearchRecordToOrderView,
  mapStatisticToTabStats,
  resolveTabForOrder,
  tabToSearchFilter,
  tabToSupplierStatus,
} from '@/services/apps/mapSupplierProductionOrderList';
