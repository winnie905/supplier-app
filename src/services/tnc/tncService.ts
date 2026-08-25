import { TNC_APP_NAME, TNC_TYPES } from '@/constants/tnc';
import { loginClient } from '@/graphql/client';
import { AGREEMENT_CONFIG_LATEST } from '@/graphql/operations/tnc/operations';
import type { AgreementConfig, TncType, TncVersion } from '@/types/tnc';

const isTncType = (value: string): value is TncType =>
  value === 'USER_AGREEMENT' || value === 'PRIVACY_POLICY';

const mapAgreementToTncVersion = (config: AgreementConfig): TncVersion => {
  const type = isTncType(config.agreementType) ? config.agreementType : 'USER_AGREEMENT';
  return {
    id: config.id,
    type,
    title: config.title,
    version: config.version,
    effectiveDate: config.effectTime,
    content: config.content,
    isCurrent: true,
  };
};

/** 对齐 REST GET /agreement-config/latest/{appName}/{agreementType} */
const fetchLatestAgreement = async (agreementType: TncType): Promise<TncVersion> => {
  const { data } = await loginClient.query<{
    agreementConfigLatest: AgreementConfig | null;
  }>({
    query: AGREEMENT_CONFIG_LATEST,
    variables: {
      appName: TNC_APP_NAME,
      agreementType,
    },
    fetchPolicy: 'network-only',
  });

  const config = data?.agreementConfigLatest;
  if (!config?.content || !config.id) {
    throw new Error('协议内容为空');
  }

  return mapAgreementToTncVersion(config);
};

export const tncService = {
  /** 并行拉取用户协议 + 隐私政策（已启用且已生效的最新版） */
  async getCurrentVersions(): Promise<TncVersion[]> {
    const results = await Promise.all(
      TNC_TYPES.map(async (type) => {
        try {
          return await fetchLatestAgreement(type);
        } catch (error) {
          console.warn(`[TNC] Failed to load ${type}:`, error);
          return null;
        }
      }),
    );
    return results.filter((item): item is TncVersion => item != null);
  },

  async getCurrentVersionByType(type: TncType): Promise<TncVersion | null> {
    try {
      return await fetchLatestAgreement(type);
    } catch (error) {
      console.warn(`[TNC] Failed to load ${type}:`, error);
      return null;
    }
  },
};
