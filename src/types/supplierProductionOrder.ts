/**
 * 供应商生产单 GraphQL 契约类型，对齐 apex-bff schema。
 * 嵌套实体仅保留 App 当前及近期会用到的字段，避免整份 schema 灌入。
 */

import type { CropOrder } from '@/types/cropOrder';
import type { ProductImage } from '@/types/productionOrder';
import type { User } from '@/types/user';

/** 生产单状态：对齐 ErpProductionOrderSupplierSearchStatus */
export type SupplierProductionOrderStatus =
  | 'Pending'
  | 'Ordered'
  | 'InProgress'
  | 'PartialComplete'
  | 'Finished';

/** 物料确认到料状态：对齐 ErpQuoteMaterialReceiveMaterialStatus */
export type ReceiveMaterialStatus = 'Pending' | 'Arrived';

export interface Brand {
  id?: number;
  name: string;
  customerId?: number;
}

export interface SizeRange {
  name: string;
  quantity?: number;
  outboundQuantity?: number;
}

/**
 * 列表排序节点，对齐 erp-web `getSortParams`：
 * `{ sort: [{ [field]: { order: 'asc' | 'desc' } }] }`
 */
export interface ProductionOrderSortNode {
  sort: Record<string, { order: 'asc' | 'desc' }>[];
}

/** ErpProductionOrderSupplierSearchInput（统计与搜索共用） */
export interface ProductionOrderSupplierSearchInput {
  keyword?: string;
  productionOrderCode?: string;
  code?: string;
  color?: string;
  customerCode?: string;
  customerPO?: string;
  productCode?: string;
  type?: string;
  status?: SupplierProductionOrderStatus[];
  isOverTime?: boolean;
  /** schema 为 ErpJSON；最后交期排序传 multiColorProductCoreData.factoryPlanedProductionDate */
  sortNode?: ProductionOrderSortNode;
}

export interface ProductionOrderSupplierCount {
  pendingCount: number;
  inProgressCount: number;
  finishedCount: number;
  pendingQuantity: number;
  inProgressQuantity: number;
  finishedQuantity: number;
  overTimeCount: number;
  overTimeQuantity: number;
}

/** schema 中除 id 外几乎全部可空，这里如实标注，避免映射时拼出 "null" 字面量 */
export interface ProductionOrderSupplierSearchColorItem {
  productionOrderCode?: string;
  code?: string;
  type?: string;
  color?: string;
  status?: string;
  factoryPlanedProductionDate?: string;
}

export interface ProductionOrderSupplierSearchRecord {
  saleOrderCode?: string;
  productionOrderCode?: string;
  /** 设计款号等 */
  code?: string;
  /** 大货款号 */
  productCode?: string;
  type?: string;
  productionOrderType?: string;
  customerCode?: string;
  customerPO?: string;
  brand?: Brand;
  businessFollower?: User;
  productionFollower?: User;
  productionType?: string;
  quantity?: number;
  productionOrderStatus?: string;
  factoryPlanedProductionDate?: string;
  productionOrders?: ProductionOrderSupplierSearchColorItem[];
  /** 款式类别 / 客户款号，对齐 erp-web templateDesign */
  templateDesign?: {
    category?: string;
    customerCode?: string;
  };
  template?: {
    frontImages?: ProductImage[];
  };
}

export interface ProductionOrderSupplierSearchResult {
  total: number;
  size: number;
  pages: number;
  page: number;
  records: ProductionOrderSupplierSearchRecord[];
}

/** getProductionOrder(productionOrderCode, color) */
export interface BomItem {
  id: number;
  type?: string;
  actionRegion?: string;
  name?: string;
  materialColor?: string;
  supplierName?: string;
  category?: string;
  specification?: string;
  formula?: string;
  usage?: string;
  width?: string;
  weight?: string;
  meters?: string;
  receiveMaterialStatus?: ReceiveMaterialStatus;
  material?: {
    id?: number;
    name?: string;
    color?: string;
    code?: string;
    imageUrls?: string[];
  };
  unit?: {
    id?: number;
    name?: string;
    unit?: string;
  };
}

export interface MaterialPackage {
  id: string;
  name: string;
  receiveMaterialStatus?: ReceiveMaterialStatus;
  remark?: string;
}

export interface ExceptionRecord {
  id: string;
  productionId: number;
  module: string;
  moduleExtend?: Record<string, unknown>;
  type: string;
  reporter?: User;
  reportedAt?: string;
  reportContent?: string;
  replier?: User;
  repliedAt?: string;
  replyContent?: string;
  isReplied?: boolean;
}

export interface ProductionOrderSupplierDetail {
  productionOrderCode: string;
  customerCode?: string;
  id: number;
  code?: string;
  type?: string;
  color: string;
  purchaseCode?: string;
  status: string;
  saleOrderCode?: string;
  orderStatus?: string;
  materialStatus?: string;
  productionType?: string;
  comment?: string;
  factoryPlanedProductionDate?: string;
  factory?: {
    id?: number;
    name?: string;
    fullName?: string;
    phone?: string;
    contact?: string;
  };
  receiveWarehouse?: {
    id?: number;
    name?: string;
    contact?: string;
    phone?: string;
  };
  orderType?: string;
  createdAt?: string;
  updatedAt?: string;
  customerPurchaseOrder?: {
    saleOrderCode?: string;
    productCode?: string;
    customerPO?: string;
    color?: string;
    colorCode?: string;
    code?: string;
    type?: string;
    quantity?: number;
    sizeRange?: SizeRange[];
    requiredProductionDate?: string;
    brand?: Brand;
    productionFollower?: User;
    businessFollower?: User;
    /** 包装要求附图 */
    packageAttachment?: string[];
  };
  templateDesign?: {
    code?: string;
    type?: string;
    customerCode?: string;
    category?: string;
    designImageUrls?: string[];
    brand?: Brand;
  };
  /** 色码样衣图：首页 Hero = frontImages + backImages（正面优先） */
  template?: {
    frontImages?: { url: string; description?: string }[];
    backImages?: { url: string; description?: string }[];
  };
  bomItems?: BomItem[];
  materialPackages?: MaterialPackage[];
  packMaterials?: MaterialPackage[];
  exceptionRecords?: ExceptionRecord[];
  /** ErpCropOrderPreviewDto；无则尚未创建，不可用生产单 id 代替 */
  cropOrder?: CropOrder;
  /** ErpCropOrderPreviewDto；无则尚未创建，不可用生产单 id 代替 */
  sewingOrder?: CropOrder;
  /** ErpCropOrderPreviewDto；无则尚未创建，不可用生产单 id 代替 */
  tailOrder?: CropOrder;
}

/** ErpQuoteMaterialInput：确认到料只回传定位与状态字段 */
export interface ConfirmArriveBomItemInput {
  id: number;
  name?: string;
  receiveMaterialStatus: ReceiveMaterialStatus;
}

/** ErpProductionCommonMaterialInput */
export interface ConfirmArriveCommonMaterialInput {
  id: string;
  name?: string;
  remark?: string;
  receiveMaterialStatus: ReceiveMaterialStatus;
}

/** ErpProductionConfirmMaterialRequestInput：三个数组均为必填 */
export interface ConfirmArriveMaterialInput {
  bomItems: ConfirmArriveBomItemInput[];
  materialPackages: ConfirmArriveCommonMaterialInput[];
  packMaterials: ConfirmArriveCommonMaterialInput[];
}

/**
 * ErpProductionExceptionRecordCreateRequestInput。
 * schema 没有 reportContent 入参，上报正文与关联物料统一放进 moduleExtend。
 */
export interface CreateExceptionRecordInput {
  productionId: number;
  module: string;
  type: string;
  reporter: User;
  moduleExtend?: Record<string, unknown>;
}
