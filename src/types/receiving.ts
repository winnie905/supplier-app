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

export interface ProductionColorSummary {
  id: string;
  productionOrderNo: string;
  bulkStyleNo: string;
  po: string;
  brand: string;
  color: string;
  colorCode?: string;
  thumbnailUrl?: string;
  imageUrls: string[];
  status: ProductionColorStatus;
  moduleStatus: ModuleStatusSummary;
}

export interface ProductionColorDetail extends ProductionColorSummary {
  styleCategory: string;
  requiredDeliveryDate: string;
  designNo: string;
  customerStyleNo: string;
  orderType: string;
  processingMethod: string;
  merchandiser: string;
  plannedTotal: number;
  sizes: string[];
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
  plannedTotal: number;
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
  /** Optional tag shown in carton picker (e.g. 最常用 / 常用). */
  tag?: string;
}

export interface PackingBoxRecord {
  id: string;
  boxNo: number;
  cartonSpecId?: string;
  /** Box weight in KG. */
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

export interface MaterialDraft {
  selectedIds: string[];
  activeTab: MaterialCategory;
}

export interface ReceivingDrafts {
  material: Record<string, MaterialDraft>;
}
