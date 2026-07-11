export type TncType = 'USER_AGREEMENT' | 'PRIVACY_POLICY';

export interface TncDeviceInfo {
  platform: 'ios' | 'android';
  osVersion?: string;
  deviceModel?: string;
  deviceId?: string;
}

export interface TncVersion {
  id: string;
  type: TncType;
  title: string;
  version: string;
  effectiveDate: string;
  content: string;
  isCurrent: boolean;
}

export interface TncConsentRecord {
  id: string;
  userId: string;
  type: TncType;
  version: string;
  agreedAt: string;
  ip?: string;
  deviceInfo?: TncDeviceInfo;
  appVersion?: string;
}

export interface TncCheckResult {
  /** @deprecated 登录页每次都会弹窗；请使用 needPersistConsent */
  needAgree: boolean;
  /** 是否需要把本次同意写入后端/本地（首次或版本更新） */
  needPersistConsent: boolean;
  requiredVersions: TncVersion[];
  agreedRecords: TncConsentRecord[];
}

export interface TncPersistedState {
  consentRecords: TncConsentRecord[];
}

export interface SubmitTncConsentInput {
  userId: string;
  types: TncType[];
}
