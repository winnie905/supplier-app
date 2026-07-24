/**
 * 箱规契约（对齐 REST：GET /api/box_specification/brand?brandId=&includeGeneral=）
 */

import type { BoxSpecificationType } from '@/types/cropOrder';
import type { SupplierApiBrand, SupplierApiUser } from '@/types/supplierProductionOrder';

/** GET /api/box_specification/brand 单条 */
export interface BoxSpecification {
  id: string;
  name?: string;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
  type?: BoxSpecificationType;
  brand?: SupplierApiBrand;
  createdAt?: string;
  updatedAt?: string;
  user?: SupplierApiUser;
  lastUpdater?: SupplierApiUser;
}

export interface BoxSpecificationByBrandInput {
  brandId: number;
  /** 是否包含通用箱子，默认 true */
  includeGeneral?: boolean;
}
