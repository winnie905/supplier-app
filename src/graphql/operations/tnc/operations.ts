/**
 * TNC GraphQL 占位；后端就绪后替换 tncService 中的 mock 实现。
 */
export const GET_CURRENT_TNC_VERSIONS = `
  query GetCurrentTncVersions {
    currentTncVersions {
      id
      type
      title
      version
      effectiveDate
      content
      isCurrent
    }
  }
`;

export const GET_USER_TNC_CONSENT_RECORDS = `
  query GetUserTncConsentRecords($userId: ID!) {
    userTncConsentRecords(userId: $userId) {
      id
      userId
      type
      version
      agreedAt
      ip
      deviceInfo {
        platform
        osVersion
        deviceModel
        deviceId
      }
      appVersion
    }
  }
`;

export const SUBMIT_TNC_CONSENT = `
  mutation SubmitTncConsent($input: SubmitTncConsentInput!) {
    submitTncConsent(input: $input) {
      id
      userId
      type
      version
      agreedAt
      ip
      appVersion
    }
  }
`;
