/**
 * 箱规契约（对齐 getBoxSpecifications(brandId, includeGeneric)）
 */

import type { BoxSpecificationType } from '@/types/cropOrder';
import type { Brand } from '@/types/supplierProductionOrder';
import type { User } from '@/types/user';

/** GET /api/box_specification/brand 单条 */
export interface BoxSpecification {
  id: string;
  name?: string;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
  type?: BoxSpecificationType;
  brand?: Brand;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  lastUpdater?: User;
}

export interface BoxSpecificationByBrandInput {
  brandId: number;
  /** 是否包含通用箱子，默认 true（映射为 BFF includeGeneric） */
  includeGeneral?: boolean;
}
