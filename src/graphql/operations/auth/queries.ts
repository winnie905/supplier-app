import { gql } from '@apollo/client';

/**
 * 获取当前登录用户信息
 */
export const GET_USER_INFO_QUERY = gql`
  query GetUserInfo {
    user {
      username
      email
      lastName
      firstName
      supplier {
        id
        isDeleted
        name
      }
      avatar
      products {
        name
        roles {
          id
          name
          privileges {
            id
            name
            displayName
          }
        }
      }
    }
  }
`;

export const GET_QRCODE_STATUS_QUERY = gql`
  query GetQrcodeStatus($deviceId: String!) {
    qrcodeStatus(deviceId: $deviceId) {
      message
      status
      refresh_token
      products
    }
  }
`;
