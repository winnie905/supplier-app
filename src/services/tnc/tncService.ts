import { getMockCurrentVersions } from '@/services/tnc/mockCatalog';
import type {
  SubmitTncConsentInput,
  TncCheckResult,
  TncConsentRecord,
  TncType,
  TncVersion,
} from '@/types/tnc';
import {
  collectTncDeviceInfo,
  getMockClientIp,
  getTncAppVersion,
} from '@/utils/tnc/consentContext';
import { appendConsentRecords, loadTncState } from '@/utils/tnc/storage';

const delay = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const createRecordId = () => `tnc-consent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const findLatestConsent = (
  records: TncConsentRecord[],
  userId: string,
  type: TncType,
): TncConsentRecord | undefined => {
  return records
    .filter((record) => record.userId === userId && record.type === type)
    .sort((a, b) => b.agreedAt.localeCompare(a.agreedAt))[0];
};

const isVersionSatisfied = (
  currentVersion: TncVersion,
  record: TncConsentRecord | undefined,
): boolean => {
  if (!record) {
    return false;
  }

  return record.version === currentVersion.version;
};

export const tncService = {
  /** 获取当前生效的用户协议与隐私政策版本（content 为富文本 HTML） */
  async getCurrentVersions(): Promise<TncVersion[]> {
    await delay();
    return getMockCurrentVersions();
  },

  /** 按类型获取当前协议详情 */
  async getCurrentVersionByType(type: TncType): Promise<TncVersion | null> {
    await delay();
    return getMockCurrentVersions().find((item) => item.type === type) ?? null;
  },

  /** 获取指定用户已同意的协议记录 */
  async getUserConsentRecords(userId: string): Promise<TncConsentRecord[]> {
    await delay();
    const state = await loadTncState();
    return state.consentRecords.filter((record) => record.userId === userId);
  },

  /**
   * 判断当前账号是否需要把同意结果写入后端/本地：
   * - 下载后该账号首次登录
   * - 协议版本更新后该账号首次登录
   *
   * 注意：登录页每次登录都会弹窗，但只有 needPersistConsent=true 时才落库。
   */
  async checkConsentStatus(userId: string): Promise<TncCheckResult> {
    await delay();

    const [requiredVersions, agreedRecords] = await Promise.all([
      tncService.getCurrentVersions(),
      tncService.getUserConsentRecords(userId),
    ]);

    const needPersistConsent = requiredVersions.some((version) => {
      const latestRecord = findLatestConsent(agreedRecords, userId, version.type);
      return !isVersionSatisfied(version, latestRecord);
    });

    return {
      needAgree: needPersistConsent,
      needPersistConsent,
      requiredVersions,
      agreedRecords,
    };
  },

  /** 提交用户同意记录（仅首次/版本变更时调用） */
  async submitConsent(input: SubmitTncConsentInput): Promise<TncConsentRecord[]> {
    await delay(200);

    const [requiredVersions, deviceInfo] = await Promise.all([
      tncService.getCurrentVersions(),
      collectTncDeviceInfo(),
    ]);

    const agreedAt = new Date().toISOString();
    const appVersion = getTncAppVersion();
    const ip = getMockClientIp();

    const types = input.types.length
      ? input.types
      : requiredVersions.map((version) => version.type);

    const records = types
      .map((type) => requiredVersions.find((version) => version.type === type))
      .filter((version): version is TncVersion => !!version)
      .map((version) => ({
        id: createRecordId(),
        userId: input.userId,
        type: version.type,
        version: version.version,
        agreedAt,
        ip,
        deviceInfo,
        appVersion,
      }));

    await appendConsentRecords(records);
    return records;
  },

  /**
   * 登录页同意后处理：
   * - 若本账号当前版本尚未落库 → 写入同意记录
   * - 若已同意过当前版本 → 只视为本轮登录确认，不重复落库
   */
  async confirmLoginConsent(userId: string): Promise<{ persisted: boolean }> {
    const check = await tncService.checkConsentStatus(userId);

    if (!check.needPersistConsent) {
      return { persisted: false };
    }

    await tncService.submitConsent({
      userId,
      types: check.requiredVersions.map((version) => version.type),
    });

    return { persisted: true };
  },
};
