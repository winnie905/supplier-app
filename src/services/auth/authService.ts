import { apolloClient, loginClient } from '@/graphql/client';
import {
  GET_ACCESS_TOKEN_MUTATION,
  LOGIN_WITH_OTP_MUTATION,
  LOGOUT_MUTATION,
  SEND_EMAIL_CODE_MUTATION,
  UPDATE_QRCODE_STATUS_MUTATION,
} from '@/graphql/operations/auth/mutations';
import { GET_QRCODE_STATUS_QUERY, GET_USER_INFO_QUERY } from '@/graphql/operations/auth/queries';
import type {
  GetAccessTokenMutationData,
  GetAccessTokenMutationVariables,
  GetUserInfoQueryResult,
  LoginWithOtpMutationData,
  LoginWithOtpMutationInput,
  LoginWithOtpMutationVariables,
  QrCodeStatus,
  SendEmailCodeMutationData,
  SendEmailCodeMutationVariables,
  SendOtpMutationInput,
  UpdateQrcodeStatusInput,
  UpdateQrcodeStatusResponse,
} from '@/types/auth';

export async function logout(username: string) {
  const { data } = await apolloClient.mutate<{ logout: boolean }, { username: string }>({
    mutation: LOGOUT_MUTATION,
    variables: { username },
  });

  return Boolean(data?.logout);
}

export async function sendOtpCode(input: SendOtpMutationInput) {
  const { data } = await loginClient.mutate<
    SendEmailCodeMutationData,
    SendEmailCodeMutationVariables
  >({
    mutation: SEND_EMAIL_CODE_MUTATION,
    variables: { input },
  });

  return data?.sendOtp;
}

export async function getUserInfo(product?: string) {
  const { data } = await apolloClient.query<GetUserInfoQueryResult>({
    query: GET_USER_INFO_QUERY,
    context: product
      ? {
          headers: {
            product,
          },
        }
      : {},
    fetchPolicy: 'network-only',
  });

  return data?.user;
}

export async function getAccessToken(product: string, refreshToken: string) {
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const { data } = await loginClient.mutate<
    GetAccessTokenMutationData,
    GetAccessTokenMutationVariables
  >({
    mutation: GET_ACCESS_TOKEN_MUTATION,
    variables: {
      input: {
        product,
        refreshToken,
      },
    },
  });

  const result = data?.accessToken;

  if (!result?.token) {
    throw new Error('No access token');
  }

  return result;
}

export async function loginWithOtp(input: LoginWithOtpMutationInput) {
  const { data } = await loginClient.mutate<
    LoginWithOtpMutationData,
    LoginWithOtpMutationVariables
  >({
    mutation: LOGIN_WITH_OTP_MUTATION,
    variables: {
      input,
    },
  });

  const result = data?.loginWithOtp;

  if (!result) {
    throw new Error('No login with otp');
  }

  return result;
}

export async function getQrcodeStatus(deviceId: string): Promise<UpdateQrcodeStatusResponse> {
  const { data } = await apolloClient.query<{ qrcodeStatus: UpdateQrcodeStatusResponse }>({
    query: GET_QRCODE_STATUS_QUERY,
    variables: { deviceId },
    fetchPolicy: 'no-cache',
  });

  if (!data?.qrcodeStatus) {
    throw new Error('No qrcode status in response');
  }

  return data.qrcodeStatus;
}

export async function updateQrcodeStatus(
  deviceId: string,
  status: QrCodeStatus,
  qrToken: string,
): Promise<UpdateQrcodeStatusResponse> {
  const { data } = await apolloClient.mutate<
    { updateQrcodeStatus: UpdateQrcodeStatusResponse },
    { input: UpdateQrcodeStatusInput }
  >({
    mutation: UPDATE_QRCODE_STATUS_MUTATION,
    variables: {
      input: { deviceId, status, qrToken },
    },
  });

  const result = data?.updateQrcodeStatus;

  if (!result) {
    throw new Error('Update qrcode status failed');
  }

  return result;
}
