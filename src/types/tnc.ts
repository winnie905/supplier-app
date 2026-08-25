export type TncType = 'USER_AGREEMENT' | 'PRIVACY_POLICY';

/** GET /agreement-config/latest/{appName}/{agreementType} 响应 */
export interface AgreementConfig {
  id: string;
  appName: string;
  agreementType: string;
  version: string;
  title: string;
  contentType: string;
  content: string;
  effectTime: string;
  isEnable: boolean;
  createdAt: string;
  /** BFF 侧可能为 null，查询里勿选该字段 */
  updatedAt?: string | null;
}

/** 页面展示用协议（由 AgreementConfig 映射） */
export interface TncVersion {
  id: string;
  type: TncType;
  title: string;
  version: string;
  effectiveDate: string;
  content: string;
  isCurrent: boolean;
}
