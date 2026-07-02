import type { ProductEnum } from './workspace';

export type PermissionType = 'read' | 'write';

export interface Role {
  id?: string;
  name: string;
  displayName?: string;
  privileges?: Privilege[];
}

export interface Privilege {
  id: string;
  name: string;
  displayName?: string;
}

export type PermissionObject = Record<PermissionType, boolean>;

export enum ErpPrivilegesType {
  /** 子工序图片采集 */
  SUB_PROCESS_COLLECT = 'SUB_PROCESS_COLLECT',

  /** 子工序写入 */
  SUB_PROCESS = 'SUB_PROCESS',
}

export enum AmoebaPrivilegeType {}

export enum CumsPrivilegeType {}

export enum SrmPrivilegeType {}

export enum MesPrivilegeType {}

/**
 * 建立 product 和 privilege 类型的映射关系。
 *
 * 好处：
 * ProductEnum.ERP 只能传 ErpPrivilegesType；
 * ProductEnum.SRM 只能传 SrmPrivilegeType；
 * 避免 product 和 permission 乱组合。
 */
export interface ProductPrivilegeMap {
  [ProductEnum.ERP]: ErpPrivilegesType;
  [ProductEnum.AMOEBA]: AmoebaPrivilegeType;
  [ProductEnum.CUMS]: CumsPrivilegeType;
  [ProductEnum.SRM]: SrmPrivilegeType;
  [ProductEnum.MES]: MesPrivilegeType;
}

/**
 * 权限结构。
 *
 * 使用 Partial 是为了兼容后端没有返回某个产品权限的情况。
 * 使用 Partial<Record<...>> 是为了兼容某些权限点没有返回的情况。
 */
export type Permission = {
  [P in keyof ProductPrivilegeMap]?: Partial<Record<ProductPrivilegeMap[P], PermissionObject>>;
};
