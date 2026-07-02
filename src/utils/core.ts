/**
 * 存放无业务耦合的通用纯函数：类型守卫、基础类型转换、
 * 跨模块复用的简单数据格式化等。
 */
import type { AuthUser } from '@/types/auth';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const toFiniteNumber = (value: unknown): number | null => {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

/** 优先级：lastName + firstName > firstName > lastName，均无则 '-' */
export const getUserName = (user: AuthUser): string => {
  if (user.firstName && user.lastName) {
    return `${user.lastName}${user.firstName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.lastName) {
    return user.lastName;
  }
  return '-';
};
