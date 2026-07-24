import type { ProductionOrderVO } from '@/types/productionOrder';
import { ProductionStatus } from '@/types/productionOrder';

/** 列表分类 Tab（整单聚合状态 + 超期） */
export type ProductionOrderTab = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type DeliverySortOrder = 'asc' | 'desc';

/** 整单聚合状态（由同 productionOrderCode 下各色 ProductionStatus 推导） */
export type ProductionOrderAggregateStatus = 'pending' | 'in_progress' | 'completed';

export interface ProductionOrderTabStat {
  orderCount: number;
  pieceCount: number;
}

/**
 * 列表卡片视图：按 productionOrderCode 聚合多条 ProductionOrderVO。
 * 展示字段直接取自 VO / customerPurchaseOrder / templateDesign。
 */
export interface ProductionOrderView {
  /** 聚合键：productionOrderCode */
  productionOrderCode: string;
  /** 代表行（取第一条），便于读取订单级共享字段 */
  representative: ProductionOrderVO;
  /** 该生产单下全部生产色（VO） */
  items: ProductionOrderVO[];
  status: ProductionOrderAggregateStatus;
  /** YYYY-MM-DD，取各色 requiredProductionDate 最大值 */
  lastDeliveryDate: string;
  colorCount: number;
  totalQty: number;
  overdue: boolean;
}

export interface ProductionOrderListResult {
  supplierName: string;
  totalOrderCount: number;
  orders: ProductionOrderView[];
  tabStats: Record<ProductionOrderTab, ProductionOrderTabStat>;
}

/** UI 色状态文案用的简化映射（来自 ProductionStatus） */
export type ProductionColorProgressStatus = 'ordered' | 'in_progress' | 'partial' | 'completed';

export const mapProductionStatusToProgress = (
  status: ProductionStatus,
): ProductionColorProgressStatus => {
  switch (status) {
    case ProductionStatus.Finished:
      return 'completed';
    case ProductionStatus.PartialComplete:
      return 'partial';
    case ProductionStatus.InProgress:
      return 'in_progress';
    case ProductionStatus.Ordered:
    case ProductionStatus.Pending:
    case ProductionStatus.QuotationCompare:
    default:
      return 'ordered';
  }
};
