/**
 * 存放「记住账号」类登录凭证的本地安全存储读写（与 Session 分离）。
 */
import * as Keychain from 'react-native-keychain';

import type { PhoneCountryCode } from '@/components/PhoneNumberField';

const REMEMBERED_EMAIL_ACCOUNT_SERVICE_NAME = 'supplier-app.remembered-login.email-account';
const REMEMBERED_PHONE_ACCOUNT_SERVICE_NAME = 'supplier-app.remembered-login.phone-account';

export interface RememberedEmailLoginAccount {
  email: string;
}

export interface RememberedPhoneLoginAccount {
  /**
   * 手机号本体号码。
   * 例如：
   * - phoneNumber: "13800138000"
   */
  phoneNumber?: string | undefined;

  /**
   * 国家/地区 ISO Code，例如：
   * - CN
   * - HK
   * - SG
   */
  countryCode?: PhoneCountryCode | undefined;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * 读取记住的邮箱账号
 *
 * 说明：
 * - 邮箱账号只需要保存 email 本身
 * - username 字段保存 email
 * - password 字段写入固定占位值，避免滥用密码字段表达业务含义
 */
export const loadRememberedEmailLoginAccount =
  async (): Promise<RememberedEmailLoginAccount | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: REMEMBERED_EMAIL_ACCOUNT_SERVICE_NAME,
      });

      if (!credentials) {
        return null;
      }

      const { username } = credentials;

      if (!isNonEmptyString(username)) {
        return null;
      }

      return {
        email: username.trim(),
      };
    } catch {
      return null;
    }
  };

/**
 * 保存邮箱账号
 */
export const saveRememberedEmailLoginAccount = async (
  account: RememberedEmailLoginAccount,
): Promise<void> => {
  const { email } = account;

  if (!isNonEmptyString(email)) {
    return;
  }

  await Keychain.setGenericPassword(email.trim(), '__email_account__', {
    service: REMEMBERED_EMAIL_ACCOUNT_SERVICE_NAME,
  });
};

/**
 * 清除记住的邮箱账号
 */
export const clearRememberedEmailLoginAccount = async (): Promise<void> => {
  await Keychain.resetGenericPassword({
    service: REMEMBERED_EMAIL_ACCOUNT_SERVICE_NAME,
  });
};

/**
 * 读取记住的手机号账号
 *
 * 说明：
 * - username 字段保存 phoneNumber
 * - password 字段保存国家/地区信息
 * - 这里用 JSON 是为了同时保存 countryIsoCode 和 callingCode
 */
export const loadRememberedPhoneLoginAccount =
  async (): Promise<RememberedPhoneLoginAccount | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: REMEMBERED_PHONE_ACCOUNT_SERVICE_NAME,
      });

      if (!credentials) {
        return null;
      }

      const { username, password } = credentials;

      if (!isNonEmptyString(username)) {
        return null;
      }

      const parsedMeta = isNonEmptyString(password)
        ? safeJsonParse<Pick<RememberedPhoneLoginAccount, 'countryCode'>>(password)
        : null;

      return {
        phoneNumber: username.trim(),
        countryCode: parsedMeta?.countryCode,
      };
    } catch {
      return null;
    }
  };

/**
 * 保存手机号账号
 *
 * 注意：
 * - phoneNumber 建议只保存不带区号的手机号
 * - callingCode / countryIsoCode 单独保存
 * - 回填时根据 countryIsoCode 或 callingCode 恢复国家/地区选择器
 */
export const saveRememberedPhoneLoginAccount = async (
  account: RememberedPhoneLoginAccount,
): Promise<void> => {
  const { phoneNumber, countryCode } = account;

  if (!isNonEmptyString(phoneNumber)) {
    return;
  }

  const meta = JSON.stringify({
    countryCode: isNonEmptyString(countryCode) ? countryCode.trim() : undefined,
  });

  await Keychain.setGenericPassword(phoneNumber.trim(), meta, {
    service: REMEMBERED_PHONE_ACCOUNT_SERVICE_NAME,
  });
};

/**
 * 清除记住的手机号账号
 */
export const clearRememberedPhoneLoginAccount = async (): Promise<void> => {
  await Keychain.resetGenericPassword({
    service: REMEMBERED_PHONE_ACCOUNT_SERVICE_NAME,
  });
};

/**
 * 清除所有登录记忆信息
 *
 * 适合退出登录、切换用户、用户取消所有记住信息时调用。
 */
export const clearAllRememberedLoginInfo = async (): Promise<void> => {
  await Promise.all([clearRememberedEmailLoginAccount(), clearRememberedPhoneLoginAccount()]);
};
