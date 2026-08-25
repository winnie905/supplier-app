/**
 * 裁床单 / 车缝单 / 尾部单契约类型（对齐 REST：
 * GET/POST/PUT /api/crop_order、POST /api/crop_order/statistic
 * GET/POST/PUT /api/sew_order、POST /api/sew_order/statistic
 * GET/POST/PUT /api/tail_order、POST /api/tail_order/statistic
 *
 * 嵌套实体仅保留 App 当前会用到的字段；swagger 中车缝/尾部与裁床单共用 cropOrderStorage 结构。
 * 尾部单读取时额外回传 tailOrderStorage（装箱工序，结构同 cropOrderStorage）。
 */

import type {
  SupplierApiBrand,
  SupplierApiSizeRange,
  SupplierApiUser,
} from '@/types/supplierProductionOrder';

/** 裁床/车缝/尾部单据状态（对齐 ErpCropOrderStatus） */
export type WorkshopOrderStatus =
  | 'Pending'
  | 'Finished'
  | 'Cancelled'
  | 'QuotationCompare'
  | 'Revert'
  | 'InProgress'
  | (string & {});

/** 对齐 ErpCropOrderCropOrderType；旧 REST 大写枚举仅兼容未改完的车缝/尾部 */
export type CropOrderType =
  | 'CropOrder'
  | 'SewingOrder'
  | 'TailOrder'
  | 'CROP_ORDER'
  | 'SEW_ORDER'
  | 'TAIL_ORDER';

/** 对齐 ErpCropProcessType（裁床用 Machine） */
export type CropProcessType =
  | 'Machine'
  | 'ManualOperation'
  | 'UpSew'
  | 'DownSew'
  | 'BrandBox'
  | 'CommonBox'
  | (string & {});

/** 箱规类型（对齐 ErpBoxSpecificationType） */
export type BoxSpecificationType = 'Brand' | 'General';

/** 工序上挂载的箱规摘要（装箱用） */
export interface BoxSpecificationRef {
  id: string;
  name?: string;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
  type?: BoxSpecificationType;
  brand?: SupplierApiBrand;
}

/** 裁片尺码数量 */
export interface CropProcessSizeRange {
  name: string;
  cropQuantity?: number;
}

/** 单次裁床/车缝/尾部工序（对应 UI 一床次 / 一日记录 / 一箱） */
export interface CropProcess {
  /** 后端生成；新建提交时不传 */
  id?: string;
  /** ISO 时间，可作提交时间或床次/日期依据 */
  cropDate?: string;
  /** 对齐 ErpCropProcessType，如 Machine */
  type?: CropProcessType;
  sizeRange?: CropProcessSizeRange[];
  totalQuantity?: number;
  maintainer?: SupplierApiUser;
  maintenanceDate?: string;
  /** 扎数（裁床 UI bundleCount） */
  parameter?: number;
  /** 箱规（尾部装箱） */
  boxSpecification?: BoxSpecificationRef;
  /** 箱重 kg */
  boxWeight?: number;
}

export interface CropOrderStorage {
  cropProcesses?: CropProcess[];
  cropTotal?: number;
}

/** 挂在裁床/车缝单上的生产单摘要（避免灌入完整 ProductionOrderVO） */
export interface WorkshopProductionOrderRef {
  id?: number;
  productionOrderCode?: string;
  code?: string;
  type?: string;
  color?: string;
  purchaseCode?: string;
  status?: string;
  saleOrderCode?: string;
  /** create/update 入参必填，App 侧用空数组占位 */
  bomItems?: unknown[];
  productionProcesses?: unknown[];
  secondaryProcesses?: unknown[];
  productionType?: string;
  factoryPlanedProductionDate?: string;
  customerPurchaseOrder?: {
    saleOrderCode?: string;
    productCode?: string;
    customerPO?: string;
    color?: string;
    code?: string;
    type?: string;
    purchaseCode?: string;
    quantity?: number;
    sizeRange?: SupplierApiSizeRange[];
    requiredProductionDate?: string;
    brand?: SupplierApiBrand & {
      invoiceRegistrationAddress?: string;
      invoiceRegistrationNumber?: string;
    };
  };
  templateDesign?: {
    code?: string;
    category?: string;
    designImageUrls?: string[];
    brand?: SupplierApiBrand;
  };
}

/**
 * GET/POST/PUT /api/crop_order
 * GET/POST/PUT /api/sew_order（结构与裁床单相同）
 */
export interface CropOrder {
  /** 后端生成；create 入参不传，update 必传真正的裁床单 id（非生产单 id） */
  id?: number;
  status?: WorkshopOrderStatus;
  cropOrderStorage?: CropOrderStorage;
  lastUpdater?: SupplierApiUser;
  user?: SupplierApiUser;
  createdAt?: string;
  updatedAt?: string;
  cropOrderType?: CropOrderType;
  productionOrder?: WorkshopProductionOrderRef;
}

/** 车缝单：当前 swagger 与裁床单同构 */
export type SewOrder = CropOrder;

/**
 * 尾部单：在 CropOrder 基础上，读取（getTailOrderById / 生产单详情）可额外带 tailOrderStorage。
 * 写入入参没有该字段，装箱数据统一提交到 cropOrderStorage。
 */
export interface TailOrder extends CropOrder {
  tailOrderStorage?: CropOrderStorage;
}

/** POST /api/crop_order|sew_order|tail_order/statistic 入参（按需裁剪） */
export interface WorkshopOrderStatisticInput {
  id?: number;
  code?: string;
  type?: string;
  color?: string;
  productCode?: string;
  productionOrderCode?: string;
  customerPO?: string;
  factory?: number;
  status?: string[];
  saleOrderCode?: string;
  cropOrderType?: CropOrderType;
  productionType?: string;
  orderType?: string;
}

/** 分类统计响应 */
export interface WorkshopOrderStatistic {
  total: number;
  totalSelf: number;
}

export type CropOrderStatisticInput = WorkshopOrderStatisticInput;
export type CropOrderStatistic = WorkshopOrderStatistic;
export type SewOrderStatisticInput = WorkshopOrderStatisticInput;
export type SewOrderStatistic = WorkshopOrderStatistic;
export type TailOrderStatisticInput = WorkshopOrderStatisticInput;
export type TailOrderStatistic = WorkshopOrderStatistic;
