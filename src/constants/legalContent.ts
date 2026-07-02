/** Hardcoded Chinese legal/compliance content (no i18n). */
import { zh } from './zhLegalSource';

export const LEGAL_SERVICE_AGREEMENT = zh.legal.serviceAgreement;
export const LEGAL_PRIVACY_POLICY = zh.legal.privacyPolicy;
export const PRIVACY_PERSONAL_INFO_COLLECTION_LIST = zh.privacy.personalInfoCollectionList;
export const PRIVACY_SDK_SHARE_LIST = zh.privacy.sdkShareList;

export const AUTH_STRINGS = {
  agree: zh.auth.agree,
  disagree: zh.auth.disagree,
  agreementModalContent: zh.auth.agreementModalContent,
  agreementModalTitle: zh.auth.agreementModalTitle,
  helloTitle: zh.auth.helloTitle,
  helloSubtitle: zh.auth.helloSubtitle,
  loginTitle: zh.auth.loginTitle,
  loginButton: zh.auth.loginButton,
  emailPlaceholder: zh.auth.emailPlaceholder,
  phonePlaceholder: zh.auth.phonePlaceholder,
  getEmailCode: zh.auth.getEmailCode,
  getPhoneCode: zh.auth.getPhoneCode,
  getVerificationCode: zh.auth.getVerificationCode,
  resendVerificationCode: zh.auth.resendVerificationCode,
  verificationCodePlaceholder: zh.auth.verificationCodePlaceholder,
  verificationCodeEmpty: zh.auth.verificationCodeEmpty,
  mockCodeSent: zh.auth.mockCodeSent,
  phoneTab: zh.auth.phoneTab,
  emailTab: zh.auth.emailTab,
  phoneCodeLogin: zh.auth.phoneCodeLogin,
  emailCodeLogin: zh.auth.emailCodeLogin,
  phoneFormatError: zh.auth.phoneFormatError,
  emailFormatError: zh.auth.emailFormatError,
  privacyPolicyNavTitle: zh.auth.privacyPolicyNavTitle,
  userServiceAgreementNavTitle: zh.auth.userServiceAgreementNavTitle,
  selectCountryRegion: zh.auth.selectCountryRegion,
  searchCountryOrCode: zh.auth.searchCountryOrCode,
  resendCountdown: zh.auth.resendCountdown,
  sessionExpiredTitle: zh.auth.sessionExpiredTitle,
  sessionExpiredMessage: zh.auth.sessionExpiredMessage,
  sessionExpiredConfirm: zh.auth.sessionExpiredConfirm,
} as const;

export const ME_STRINGS = {
  tab: '我的',
  title: '我的',
  about: zh.me.about,
  logout: zh.me.logout,
  logoutConfirm: zh.me.logoutConfirm,
  logoutTitle: zh.me.logoutTitle,
} as const;

export const ABOUT_STRINGS = {
  title: zh.about.title,
  version: zh.about.version,
  copyright: zh.about.copyright,
} as const;

export const QR_SCAN_STRINGS = {
  back: '返回',
  scanRequestingPermission: '正在申请相机权限…',
  scanNoPermission: '未获得相机权限，无法进行扫码',
  scanTip: '请将二维码放入框内',
  scanTorch: '轻触照亮',
  scanSuccess: '扫码成功',
} as const;

export const COMMON_STRINGS = {
  alertTitle: zh.common.alertTitle,
  cancel: zh.common.cancel,
} as const;

export const COUNTRY_LABELS: Record<string, string> = zh.auth.countries;
