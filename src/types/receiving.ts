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
  quantity: number;
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
  /** 对应 ProductionOrderVO.id（路由/存储仍用 string；mock 暂用 legacy color id） */
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
  quantity?: string;
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
  type: string;
  status: ExceptionReplyStatus;
  reporter: string;
  reportedAt: string;
  content: string;
  description: string;
  replyContent?: string;
  repliedAt?: string;
  relatedItemIds?: string[];
  images?: string[];
}

export interface CuttingBedRecord {
  id: string;
  bedNo: number;
  bundleCount: number;
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
  type: CartonSpecType;
  tag?: string;
}

export interface PackingBoxRecord {
  id: string;
  boxNo: number;
  cartonSpecId?: string;
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

export interface MaterialDraft {
  selectedIds: string[];
}

export interface ReceivingDrafts {
  material: Record<string, MaterialDraft>;
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

export const sizeNamesFromRange = (sizeRange: SizeRange[]): string[] =>
  sizeRange.map((item) => item.name);
