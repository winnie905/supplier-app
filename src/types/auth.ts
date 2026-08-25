import type { StoredSession } from '@/utils/auth/authStorage';

import type { Permission, Role } from './roles';
import type { ProductEnum } from './workspace';

/** 对齐 schema Supplier（挂在 User.supplier） */
export interface AuthSupplier {
  createdAt: string;
  id: string;
  isDeleted: boolean;
  name: string;
  supplierNo?: string | null;
  supplierState?: string | null;
  supplierType?: string | null;
  updatedAt: string;
}

export interface AuthUser {
  avatar: string;
  email: string;
  id: string;
  name: string;
  username: string;
  /** schema 为 [UserServiceJSON!]!，内容仍按 AuthProduct 结构使用 */
  products: AuthProduct[];
  permissions: Permission;
  firstName: string;
  lastName: string;
  supplier: AuthSupplier;
}

export interface AuthProduct {
  createdAt: string;
  id: string;
  name: ProductEnum;
  updatedAt: string;
  roles: Role[];
}

export type LogoutReason = 'manual' | 'kickedOffline' | 'expired';

export interface SignOutOptions {
  /** 跳过 logout API，避免 session 已失效时再次触发 401。 */
  skipLogoutRequest?: boolean;
  reason?: LogoutReason;
}

export interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  user: StoredSession['user'] | null;
  sessionExpiredMessage: string | null;
  logoutReason: LogoutReason | null;
  isHandlingSessionExpired: boolean;
  getProfile: (session?: StoredSession) => Promise<AuthUser | null>;
  signIn: (session: StoredSession) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  restoreSession: () => Promise<void>;
  getAccessToken: (session?: StoredSession) => Promise<StoredSession>;
  consumeSessionExpiredMessage: () => string | undefined;
  handleSessionExpired: (options?: {
    message?: string;
    reason?: LogoutReason;
    skipLogoutRequest?: boolean;
  }) => Promise<void>;
  handleSessionKickedOffline: (message?: string) => Promise<void>;
}

export interface LoginSession {
  products: ProductEnum[];
  token: string;
  refreshToken: string;
  expiredAt: number;
  expiresIn: string;
  refreshTokenExpiredAt: string;
  refreshTokenExpiresIn: string;
}

export type RefreshTokenMutationData = LoginSession;

export interface SendEmailCodeMutationData {
  sendOtp: string;
}

export interface SendOtpMutationInput {
  email?: string;
  mobile?: string;
  areaCode?: string | undefined;
}
export interface SendEmailCodeMutationVariables {
  input: SendOtpMutationInput;
}

export interface GetUserInfoQueryResult {
  user: AuthUser;
}

export interface GetAccessTokenMutationData {
  accessToken: LoginSession;
}

export interface GetAccessTokenMutationInput {
  product: string;
  refreshToken: string;
}
export interface GetAccessTokenMutationVariables {
  input: GetAccessTokenMutationInput;
}

export interface LoginWithOtpMutationData {
  loginWithOtp: LoginSession;
}

export interface LoginWithOtpMutationVariables {
  input: LoginWithOtpMutationInput;
}

export interface LoginWithOtpMutationInput extends SendOtpMutationInput {
  otp: string;
}

export interface ActiveRefreshAccessToken {
  refreshToken: string;
  promise: Promise<StoredSession>;
}

export enum QrCodeStatus {
  SCANNING = 'SCANNING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
}

export interface UpdateQrcodeStatusResponse {
  status: QrCodeStatus;
  message: string;
  refresh_token?: string;
  products?: string[];
}

export interface UpdateQrcodeStatusInput {
  deviceId: string;
  status: QrCodeStatus;
  qrToken: string;
}
