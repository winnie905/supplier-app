import { MOCK_PRIVACY_POLICY_HTML, MOCK_USER_AGREEMENT_HTML } from '@/services/tnc/mockHtmlContent';
import type { TncVersion } from '@/types/tnc';

/** Mock 协议版本库；content 为后端富文本 HTML 字符串 */
export const MOCK_TNC_VERSIONS: TncVersion[] = [
  {
    id: 'ua-1.0.0',
    type: 'USER_AGREEMENT',
    title: '供应商协同平台用户协议',
    version: '1.0.0',
    effectiveDate: '2026-04-15',
    content: MOCK_USER_AGREEMENT_HTML.replace('2026年7月1日', '2026年4月15日'),
    isCurrent: false,
  },
  {
    id: 'ua-1.1.0',
    type: 'USER_AGREEMENT',
    title: '供应商协同平台用户协议',
    version: '1.1.0',
    effectiveDate: '2026-07-01',
    content: MOCK_USER_AGREEMENT_HTML,
    isCurrent: true,
  },
  {
    id: 'pp-1.0.0',
    type: 'PRIVACY_POLICY',
    title: '隐私政策',
    version: '1.0.0',
    effectiveDate: '2026-04-15',
    content: MOCK_PRIVACY_POLICY_HTML.replace('2026年7月1日', '2026年4月15日'),
    isCurrent: false,
  },
  {
    id: 'pp-1.1.0',
    type: 'PRIVACY_POLICY',
    title: '隐私政策',
    version: '1.1.0',
    effectiveDate: '2026-07-01',
    content: MOCK_PRIVACY_POLICY_HTML,
    isCurrent: true,
  },
];

export const getMockCurrentVersions = (): TncVersion[] =>
  MOCK_TNC_VERSIONS.filter((item) => item.isCurrent);
