/**
 * 供应商生产单相关 HTTP/GraphQL 契约类型（对齐 BFF 接驳前的 REST 文档）。
 * 嵌套实体仅保留 App 当前及近期会用到的字段，避免整份 swagger 灌入。
 */

/** 生产单状态：Pending 待生产 / InProgress 生产中 / Finished 已完成 */
export type SupplierProductionOrderStatus = 'Pending' | 'InProgress' | 'Finished';

export const SUPPLIER_PRODUCTION_ORDER_STATUS_LABEL: Record<SupplierProductionOrderStatus, string> =
  {
    Pending: '待生产',
    InProgress: '生产中',
    Finished: '已完成',
  };

/** 工厂领料状态 */
export type FactoryReceiveMaterialStatus = 'PART' | 'COMPLETE';

/** 物料确认到料状态（bom / 包材等） */
export type ReceiveMaterialStatus = 'PENDING' | 'ARRIVED' | 'SHORTAGE' | 'QUALITY_ISSUE';

export interface SupplierApiUser {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  pinyinAbbreviation?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
}

export interface SupplierApiBrand {
  id?: number;
  name: string;
  customerId?: number;
}

export interface SupplierApiSizeRange {
  name: string;
  quantity?: number;
  outboundQuantity?: number;
}

/** POST /api/production_orders/supplier/statistic */
export interface ProductionOrderSupplierStatisticInput {
  status?: SupplierProductionOrderStatus[];
  productionOrderCode?: string;
  isOverTime?: boolean;
}

export interface ProductionOrderSupplierCount {
  pendingCount: number;
  inProgressCount: number;
  finishedCount: number;
  pendingQuantity: number;
  inProgressQuantity: number;
  finishedQuantity: number;
  overTimeCount: number;
  /** 超期生产单件数合计 */
  overTimeQuantity: number;
}

/** POST /api/production_orders/supplier/search */
export interface ProductionOrderSupplierSearchInput {
  keyword?: string;
  productionOrderCode?: string;
  isOverTime?: boolean;
  /** query: page */
  page?: number;
  /** query: size */
  size?: number;
}

export interface ProductionOrderSupplierSearchColorItem {
  /** 生产色 id，对应详情 productionId */
  id?: number;
  productionOrderCode: string;
  code?: string;
  type?: string;
  color: string;
  status: string;
  factoryPlanedProductionDate?: string;
  quantity?: number;
}

export interface ProductionOrderSupplierSearchRecord {
  saleOrderCode?: string;
  productionOrderCode: string;
  code?: string;
  type?: string;
  productionOrderType?: string;
  customerCode?: string;
  customerPO?: string;
  brand?: SupplierApiBrand;
  businessFollower?: SupplierApiUser;
  productionFollower?: SupplierApiUser;
  productionType?: string;
  quantity?: number;
  productionOrderStatus?: string;
  factoryPlanedProductionDate?: string;
  productionOrders?: ProductionOrderSupplierSearchColorItem[];
  /** 便于列表展示的扩展字段（mock / BFF 可回传） */
  productCode?: string;
  category?: string;
  designImageUrls?: string[];
  requiredProductionDate?: string;
}

export interface ProductionOrderSupplierSearchResult {
  total: number;
  size: number;
  pages: number;
  page: number;
  records: ProductionOrderSupplierSearchRecord[];
  statistic?: ProductionOrderSupplierCount | Record<string, unknown>;
}

/** GET /api/production_orders/supplier/{productionOrderCode}?color= */
export interface SupplierBomItem {
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

export interface SupplierMaterialPackage {
  id: string;
  name: string;
  receiveMaterialStatus?: ReceiveMaterialStatus;
  remark?: string;
}

export interface SupplierExceptionRecord {
  id: string;
  productionId: number;
  module: string;
  moduleExtend?: Record<string, unknown>;
  type: string;
  reporter?: SupplierApiUser;
  reportedAt?: string;
  reportContent?: string;
  replier?: SupplierApiUser;
  repliedAt?: string;
  replyContent?: string;
  isReplied?: boolean;
}

export interface ProductionOrderSupplierDetail {
  productionOrderCode: string;
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
  /** 工厂领料状态 PART=部分到料 COMPLETE=全部到料 */
  factoryReceiveMaterialStatus?: FactoryReceiveMaterialStatus;
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
    sizeRange?: SupplierApiSizeRange[];
    requiredProductionDate?: string;
    brand?: SupplierApiBrand;
    productionFollower?: SupplierApiUser;
    businessFollower?: SupplierApiUser;
    /** 包装要求附图 */
    packageAttachment?: string[];
  };
  templateDesign?: {
    code?: string;
    type?: string;
    customerCode?: string;
    category?: string;
    designImageUrls?: string[];
    brand?: SupplierApiBrand;
  };
  bomItems?: SupplierBomItem[];
  materialPackages?: SupplierMaterialPackage[];
  packMaterials?: SupplierMaterialPackage[];
  exceptionRecords?: SupplierExceptionRecord[];
}

/** PUT /api/production_orders/supplier/confirm_arrive_material/{productionId} body */
export interface ConfirmArriveMaterialInput {
  bomItems?: SupplierBomItem[];
  materialPackages?: SupplierMaterialPackage[];
  packMaterials?: SupplierMaterialPackage[];
}

/** POST /api/production_orders/supplier/exception_record */
export interface CreateExceptionRecordInput {
  productionId: number;
  module: string;
  moduleExtend?: Record<string, unknown>;
  type: string;
  reporter?: SupplierApiUser;
  reportContent?: string;
}
