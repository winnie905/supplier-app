import type { SizeRange } from '@/types/productionOrder';

export type ProductionColorStatus = 'active' | 'completed';

export type MaterialModuleStatus = 'pending' | 'partial' | 'all_arrived' | 'exception';

export type MaterialItemStatus = 'pending' | 'arrived' | 'shortage' | 'quality_issue';

export type MaterialCategory = 'fabric' | 'packaging' | 'data_package';

export type ExceptionModule = 'material' | 'cutting';

export type ExceptionReplyStatus = 'pending' | 'replied';

export type CartonSpecType = 'brand' | 'general';

export interface SizeQuantity {
  size: string;
  quantity: number | null;
}

export interface ModuleStatusSummary {
  material: MaterialModuleStatus;
  cutting: { cutTotal: number; hasException: boolean };
  sewing: { upTotal: number; downTotal: number };
  packing: { boxCount: number; pieceCount: number };
}

/**
 * 收发管理「生产色」摘要。
 * 字段命名对齐 erp-web ProductionOrderVO（一条 VO = 一个生产色）。
 */
export interface ProductionColorSummary {
  /** 生产色复合 id：生产单号::颜色 */
  id: string;
  productionOrderCode: string;
  productCode: string;
  customerPO: string;
  brand: string;
  color: string;
  colorCode?: string;
  thumbnailUrl?: string;
  imageUrls: string[];
  status: ProductionColorStatus;
  moduleStatus: ModuleStatusSummary;
}

export interface ProductionColorDetail extends ProductionColorSummary {
  /** templateDesign.category */
  category: string;
  requiredProductionDate: string;
  /** customerPurchaseOrder.code（设计款号） */
  code: string;
  /** templateDesign.customerCode（客户款号） */
  customerCode: string;
  orderType: string;
  /** ProductionOrderVO.productionType */
  productionType: string;
  productionFollowerName: string;
  /** customerPurchaseOrder.quantity */
  quantity: number;
  sizeRange: SizeRange[];
  /** customerPurchaseOrder.packageAttachment（包装要求附图） */
  packageAttachment?: string[];
}

export interface MaterialItem {
  id: string;
  category: MaterialCategory;
  groupName: string;
  name: string;
  color?: string;
  /** 数量数值（meters / usage / formula） */
  quantity?: string;
  /** 数量与幅宽共用单位，来自 bomItem.unit */
  unit?: string;
  /** 幅宽数值 */
  width?: string;
  supplier?: string;
  statuses: MaterialItemStatus[];
}

export interface MaterialConfirmationData {
  productionColorId: string;
  items: MaterialItem[];
  progressPercent: number;
  arrivedCount: number;
  totalCount: number;
}

export interface FactoryException {
  id: string;
  productionColorId: string;
  module: ExceptionModule;
  /** 异常模块展示名：物料齐备 / 裁床 */
  moduleLabel: string;
  type: string;
  status: ExceptionReplyStatus;
  reporter: string;
  reportedAt: string;
  /**
   * 异常内容展示：
   * - 物料：【物料齐备】物料名、…
   * - 裁床：【裁床】
   */
  content: string;
  /** 问题描述正文（不含异常类型前缀；UI 拼成【类型】描述） */
  description: string;
  replyContent?: string;
  repliedAt?: string;
  relatedItemIds?: string[];
  /** 已选物料名称（供展示；web 也可直接读 moduleExtend.relatedItems） */
  relatedItemNames?: string[];
  images?: string[];
}

export interface CuttingBedRecord {
  id: string;
  bedNo: number;
  bundleCount: number | null;
  sizeQuantities: SizeQuantity[];
  submitted: boolean;
  submittedAt?: string;
}

export interface CuttingRecordsData {
  productionColorId: string;
  beds: CuttingBedRecord[];
  editingBedId?: string;
  quantity: number;
  sizes: string[];
}

export interface SewingDayRecord {
  id: string;
  date: string;
  upQuantities: SizeQuantity[];
  downQuantities: SizeQuantity[];
  submitted: boolean;
  submittedAt?: string;
  /** 后端上数工序 id；本地草稿无 */
  upProcessId?: string;
  /** 后端下数工序 id；本地草稿无 */
  downProcessId?: string;
}

export interface SewingRecordsData {
  productionColorId: string;
  records: SewingDayRecord[];
  sizes: string[];
  today: string;
}

export interface CartonSpec {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  unit: string;
  type: CartonSpecType;
  tag?: string;
}

export interface PackingBoxRecord {
  id: string;
  boxNo: number;
  cartonSpecId?: string;
  /** 选箱时写入，提交时映射 BrandBox / CommonBox */
  cartonSpecType?: CartonSpecType;
  /** 提交 boxSpecification 必填；选箱 / 回显时写入 */
  cartonSpecName?: string;
  cartonSpecUnit?: string;
  cartonSpecLength?: number;
  cartonSpecWidth?: number;
  cartonSpecHeight?: number;
  weightKg: number;
  sizeQuantities: SizeQuantity[];
  submitted: boolean;
  submittedAt?: string;
}

export interface PackingRecordsData {
  productionColorId: string;
  boxes: PackingBoxRecord[];
  editingBoxId?: string;
  sizes: string[];
}

export interface ReceivingPersistedState {
  selectedProductionColorId: string | null;
  materialItems: Record<string, MaterialItem[]>;
  cuttingBeds: Record<string, CuttingBedRecord[]>;
  cuttingEditingBedId: Record<string, string | undefined>;
  sewingRecords: Record<string, SewingDayRecord[]>;
  packingBoxes: Record<string, PackingBoxRecord[]>;
  packingEditingBoxId: Record<string, string | undefined>;
  exceptions: FactoryException[];
}
