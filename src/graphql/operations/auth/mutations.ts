import { gql } from '@apollo/client';

/**
 * 发送邮箱验证码
 */
export const SEND_EMAIL_CODE_MUTATION = gql`
  mutation SendOtp($input: SendOtpDto!) {
    sendOtp(input: $input)
  }
`;

/**
 * 刷新 access token
 */
export const GET_ACCESS_TOKEN_MUTATION = gql`
  mutation GetAccessToken($input: AccessTokenInput!) {
    accessToken(input: $input) {
      token
      expiredAt
      expiresIn
      refreshToken
    }
  }
`;

/**
 * 邮箱验证码登录
 */
export const LOGIN_WITH_OTP_MUTATION = gql`
  mutation LoginWithOtp($input: LoginWithOtpInput!) {
    loginWithOtp(input: $input) {
      token
      expiredAt
      expiresIn
      refreshToken
      products
    }
  }
`;

/**
 * 退出登录
 */
export const LOGOUT_MUTATION = gql`
  mutation Logout($username: String!) {
    logout(username: $username)
  }
`;

/**
 * 更新二维码状态
 */
export const UPDATE_QRCODE_STATUS_MUTATION = gql`
  mutation UpdateQrcodeStatus($input: UpdateQrcodeStatusInput!) {
    updateQrcodeStatus(input: $input) {
      status
      message
      refresh_token
      products
    }
  }
`;
