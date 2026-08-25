import { gql } from '@apollo/client';

/**
 * 协议配置 GraphQL（对齐 REST：GET /agreement-config/latest/{appName}/{agreementType}）
 */

// 不请求 updatedAt：BFF 将该字段标为非空，但库内常为 null，会导致整次 query 失败
const AGREEMENT_CONFIG_FIELDS = `
  id
  appName
  agreementType
  version
  title
  contentType
  content
  effectTime
  isEnable
  createdAt
`;

export const AGREEMENT_CONFIG_LATEST = gql`
  query AgreementConfigLatest($appName: String!, $agreementType: String!) {
    agreementConfigLatest(appName: $appName, agreementType: $agreementType) {
      ${AGREEMENT_CONFIG_FIELDS}
    }
  }
`;
