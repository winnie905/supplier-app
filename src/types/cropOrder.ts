/**
 * 裁床单 / 车缝单 / 尾部单契约类型（对齐 REST：
 * GET/POST/PUT /api/crop_order、POST /api/crop_order/statistic
 * GET/POST/PUT /api/sew_order、POST /api/sew_order/statistic
 * GET/POST/PUT /api/tail_order、POST /api/tail_order/statistic
 *
 * 嵌套实体仅保留 App 当前会用到的字段；swagger 中车缝/尾部与裁床单共用 cropOrderStorage 结构。
 * 尾部单 GET 额外回传 tailOrderStorage（装箱工序，结构同 cropOrderStorage）。
 */

import type {
  SupplierApiBrand,
  SupplierApiSizeRange,
  SupplierApiUser,
} from '@/types/supplierProductionOrder';

/** 裁床/车缝/尾部单据状态（与后端枚举对齐，未知值按 string 透传） */
export type WorkshopOrderStatus = 'Pending' | 'InProgress' | 'Finished' | (string & {});

/** cropOrderType：裁床 CROP_ORDER；车缝/尾部 swagger 仍可能回传同枚举或 SEW_ORDER / TAIL_ORDER */
export type CropOrderType = 'CROP_ORDER' | 'SEW_ORDER' | 'TAIL_ORDER' | (string & {});

/** 箱规类型（对齐 box_specification.type） */
export type BoxSpecificationType = 'GENERAL' | 'BRAND' | (string & {});

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
  id: string;
  /** ISO 时间，可作提交时间或床次/日期依据 */
  cropDate?: string;
  /** 如 machine */
  type?: string;
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
  factoryPlanedProductionDate?: string;
  customerPurchaseOrder?: {
    saleOrderCode?: string;
    productCode?: string;
    customerPO?: string;
    color?: string;
    quantity?: number;
    sizeRange?: SupplierApiSizeRange[];
    requiredProductionDate?: string;
    brand?: SupplierApiBrand;
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
  id: number;
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
 * 尾部单：在 CropOrder 基础上，GET 可额外带 tailOrderStorage（装箱记录）。
 * POST/PUT 入参 swagger 仍以 cropOrderStorage 为主；App 写入装箱数据优先用 tailOrderStorage。
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
