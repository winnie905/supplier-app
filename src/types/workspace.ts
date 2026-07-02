import type { ImageSourcePropType } from 'react-native';

import type { PermissionType, ProductPrivilegeMap } from './roles';

export interface WorkspaceModuleItemBase {
  accentColor: string;
  id: string;
  title: string;
  path?: string;
  imageSrc?: ImageSourcePropType;
}

/**
 * 有权限控制的模块。
 *
 * 只要配置了 permission，就必须同时配置 product 和 permissionType。
 */
type WorkspaceModuleItemWithPermission = {
  [P in keyof ProductPrivilegeMap]: {
    product: P;
    permission: ProductPrivilegeMap[P];
    permissionType: PermissionType;
  };
}[keyof ProductPrivilegeMap];

/**
 * 无权限控制的模块。
 *
 * 没有 permission 时，不允许单独配置 permissionType，避免配置半截权限。
 */
interface WorkspaceModuleItemWithoutPermission {
  product?: ProductEnum;
  permission?: never;
  permissionType?: never;
}

export type WorkspaceModuleItem = WorkspaceModuleItemBase &
  (WorkspaceModuleItemWithPermission | WorkspaceModuleItemWithoutPermission);

export enum ProductEnum {
  CUMS = 'CUMS',
  ERP = 'ERP',
  SRM = 'SRM',
  AMOEBA = 'AMOEBA',
  MES = 'MES',
}

export interface ProcessValuationPhotoItem {
  id: string;
  uri: string;
  createdAt: number;
}
export interface QrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BaseQrCodeCandidate {
  rawValue: string;

  /**
   * VisionCamera 返回的码类型。
   * 例如：qr
   */
  barcodeType: string;

  boundingBox?: QrBoundingBox;
  displayText?: string;
}

/**
 * 工序核价二维码类型
 *
 * - single: 单个工序核价
 * - multiple: 版房工序核价列表
 */

export enum QrCodeCandidateModeEnum {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

/**
 * 单个工序：
 * 二维码内容只需要 id。
 */
export interface SingleQrCodeCandidate extends BaseQrCodeCandidate {
  mode: QrCodeCandidateModeEnum.SINGLE;
  id: number;
}

/**
 * 多个工序：
 * 二维码内容不再用 id，而是使用 code / color / type。
 *
 * 这里把二维码里的 type 映射成 bizType，
 * 避免和 barcodeType 冲突。
 */
export interface MultipleQrCodeCandidate extends BaseQrCodeCandidate {
  mode: QrCodeCandidateModeEnum.MULTIPLE;
  code: string;
  color: string;
  bizType: string;
}

export type QrCodeCandidate = SingleQrCodeCandidate | MultipleQrCodeCandidate;
