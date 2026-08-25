import type { TncType } from '@/types/tnc';

/** 协议配置 API 的应用名 */
export const TNC_APP_NAME = 'SupplierApp';

export const TNC_TYPES: readonly TncType[] = ['USER_AGREEMENT', 'PRIVACY_POLICY'] as const;

export const TNC_TYPE_LABELS: Record<TncType, string> = {
  USER_AGREEMENT: '用户协议',
  PRIVACY_POLICY: '隐私政策',
};

export const TNC_DOCUMENT_TITLES: Record<TncType, string> = {
  USER_AGREEMENT: '供应商协同平台用户协议',
  PRIVACY_POLICY: '隐私政策',
};
