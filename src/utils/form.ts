/**
 * 存放登录/注册表单相关工具：输入格式校验、
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

/** 邮箱格式校验：常规格式 + 有且仅有一个 @ */
export const isValidEmailFormat = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const atCount = (trimmed.match(/@/g) ?? []).length;
  if (atCount !== 1) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};
