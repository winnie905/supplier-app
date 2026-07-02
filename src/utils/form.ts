/**
 * 存放登录/注册表单相关工具：输入格式校验、敏感信息脱敏展示、
 * 从异常对象提取用户可读错误文案等。
 */
import type { ApiError } from '@/types';

const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'message' in error;

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error) && typeof error.message === 'string') {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
};

/** 简单邮箱格式校验（足够覆盖常见登录场景） */
export const isValidEmailFormat = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/** 脱敏展示，例如 a***@example.com */
export const maskEmail = (email: string): string => {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) {
    return trimmed;
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (local.length <= 1) {
    return `*${trimmed.slice(at)}`;
  }

  return `${local[0]}***@${domain}`;
};

export const maskPhone = (phone: string) => {
  const normalized = phone.trim();

  if (normalized.length <= 5) return normalized;

  return `${normalized.slice(0, 3)}****${normalized.slice(-2)}`;
};
