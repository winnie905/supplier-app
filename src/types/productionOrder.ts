/**
 * 对齐 erp-web `src/services/productionOrder.ts` 的 ProductionOrderVO。
 * 嵌套实体按 VO 实际引用精简字段，保证与 ERP 列表/详情接口字段一致。
 */

export enum ProductionOrderStatus {
  Finished = 'Finished',
  Revert = 'Revert',
  Pending = 'Pending',
  QuotationCompare = 'QuotationCompare',
}

export enum ProductionStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  PartialComplete = 'PartialComplete',
  Finished = 'Finished',
  Ordered = 'Ordered',
  QuotationCompare = 'QuotationCompare',
}

export enum MaterialBulkPurchaseOrderStatus {
  Pending = 'Pending',
  PurchaseInProgress = 'PurchaseInProgress',
  PartiallyArrived = 'PartiallyArrived',
  AllArrived = 'AllArrived',
  Canceled = 'Canceled',
}

export type ClothOutboundOrderStatus = 'Created' | 'Pending' | 'Dispatched';

export enum OrderStatus {
  OrderCreated = 'OrderCreated',
  OrderFinished = 'OrderFinished',
}

export interface SizeRange {
  name: string;
  quantity?: number;
  outboundQuantity?: number;
  id?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  parentId: string | null;
  type: string;
  lastUpdaterId?: number;
  userId?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  dateOfBirth: string;
  gender: string;
  mobile?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  category?: CategoryItem;
}

export interface Brand {
  id?: number;
  name: string;
  customerId: number;
}

export interface Address {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
}

export interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  fullName?: string;
  contact?: string;
  address?: Address;
  srmId?: string;
  supplierType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id?: number;
  name: string;
  phone?: string;
  contact?: string;
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExporterParty {
  id: string;
  name: string;
  taxpayerCode: string;
  contactPhone: string;
  address: Address;
  invoiceAmount: number;
  currency: string;
  remark: string;
  contactPerson: string;
}

export interface TemplateDesign {
  customerCode: string;
  code?: string;
  type: string;
  brand?: Brand;
  brandId?: number;
  designImageUrls: string[];
  sizeGuideUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  developmentType: string;
  category: string;
}

/** 裁床单在 ERP 中会回挂 ProductionOrderVO；移动端仅保留必要字段，避免循环过深 */
export interface CropOrder {
  id?: number;
  status?: string;
  created?: string;
  updatedAt?: string;
}

export interface Template {
  id?: number | string;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteMaterial {
  id?: number | string;
  materialId?: number;
  materialCode?: string;
  materialColor?: string;
  supplierName?: string;
  materialUnitPrice?: number;
  quantity?: number;
  magnification?: number;
}

export interface QuoteProcess {
  id?: number | string;
  magnification?: number;
  price?: number;
  name: string;
  type: string;
  comment?: string;
  unitPrice?: number;
}

export interface SecondaryProcessInfo {
  id?: number;
  name?: string;
  supplierName?: string;
  supplierId?: number;
  price?: number;
  unitPrice?: number;
  unitDosage?: number;
  description?: string;
  docUrls?: string[];
  loss?: number;
  isNew?: boolean;
}

export interface CustomerPurchaseOrderOnProductionOrder {
  saleOrderCode: string;
  ingredient: string;
  ingredientCn?: string;
  colorCode: string;
  code: string;
  type: string;
  color: string;
  saleOrderDate: string;
  purchaseCode: string;
  unitPrice: number;
  rmbUnitPrice: number;
  isUnderApproval: boolean;
  currencyRate: number;
  currency: string;
  refPurchaseCode: string;
  customerPO: string;
  firstClothOutboundOrderStatus: ClothOutboundOrderStatus;
  firstActualOutboundDate: string;
  saleComment: string;
  destination: string;
  deliveryMethod: string;
  inspectionMethod: string;
  inspectionDescription: string;
  inspectionRate: string;
  ingredientDescription: string;
  packageAttachment?: string[];
  saleOrderAttachment?: string[];
  customerComment: string;
  productCode: string;
  sizeRange: SizeRange[];
  quantity: number;
  customerColor: string;
  quoteStatus: OrderStatus;
  saleOrderStatus: OrderStatus;
  productionOrderStatus: OrderStatus;
  requiredProductionDate: string;
  createdAt: string;
  updatedAt: string;
  businessFollower: User;
  department: CategoryItem;
  group: CategoryItem;
  productionFollower: User;
  brand: Brand;
  exportParty?: ExporterParty;
}

/** 与 erp-web ProductionOrderVO 字段对齐（一条记录 = 一个生产色） */
export interface ProductionOrderVO {
  id: number;
  code: string;
  type: string;
  color: string;
  purchaseCode: string;
  status: ProductionStatus;
  totalOutboundQuantity: number;
  totalPurchasePrice: number;
  saleOrderCode: string;
  orderStatus: ProductionOrderStatus;
  materialStatus: MaterialBulkPurchaseOrderStatus;
  nonReplenishBulkOrderStatus: MaterialBulkPurchaseOrderStatus;
  productionType: string;
  productionOrderCode: string;
  comment: string;
  factoryPlanedProductionDate: string;
  factory: Supplier;
  receiveWarehouse: Warehouse;
  rmbUnitPrice: number;
  rmbPrice: number;
  externalRmbUnitPrice: number;
  externalRmbPrice: number;
  externalUnitPrice: number;
  externalPrice: number;
  secondaryProcessPrice: number;
  externalCurrency: string;
  externalCurrencyRate: number;
  orderType: string;
  createdAt: string;
  updatedAt: string;
  customerPurchaseOrder: CustomerPurchaseOrderOnProductionOrder;
  templateDesign: TemplateDesign;
  shipInformation: string;
  cropOrder: CropOrder;
  template: Template;
  user: User;
  lastUpdater: User;
  bomItems: QuoteMaterial[];
  productionProcesses: QuoteProcess[];
  secondaryProcesses: SecondaryProcessInfo[];
}

export const ProductionStatusTitle: Record<ProductionStatus, string> = {
  [ProductionStatus.Ordered]: '待下单',
  [ProductionStatus.Pending]: '已下单',
  [ProductionStatus.InProgress]: '生产中',
  [ProductionStatus.PartialComplete]: '部分生产完成',
  [ProductionStatus.Finished]: '已完成',
  [ProductionStatus.QuotationCompare]: '询价中',
};
