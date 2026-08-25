/** 对齐 ErpCategory / getSystemConfig.categories */
export interface SystemCategory {
  id: string;
  name: string;
  value?: string | null;
  fullName: string;
  parentId?: string | null;
  isLeaf: boolean;
  isDeleted: boolean;
}

export interface SystemConfig {
  categories: SystemCategory[];
}
