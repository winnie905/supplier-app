/**
 * 存放 GraphQL/HTTP 层与会话相关的错误识别与请求辅助：
 * 未授权判断、踢下线消息提取、接口公共参数拼装等。
 */
import { CombinedGraphQLErrors } from '@apollo/client/errors';

import { SESSION_KICKED_OFFLINE_MESSAGE_MARKER } from '@/constants/auth';
import { GraphQLHttpStatus } from '@/constants/httpStatus';
import type { ProductEnum } from '@/types/workspace';

export function isUnauthorizedCode(code: unknown): boolean {
  return code === GraphQLHttpStatus.Unauthorized || code === String(GraphQLHttpStatus.Unauthorized);
}

export function isUnauthorizedGraphQLError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }

  return error.errors.some((item) => isUnauthorizedCode(item.extensions?.code));
}

function isKickedOfflineGraphQLErrorItem(item: CombinedGraphQLErrors['errors'][number]): boolean {
  return (
    isUnauthorizedCode(item.extensions?.code) &&
    typeof item.message === 'string' &&
    item.message.includes(SESSION_KICKED_OFFLINE_MESSAGE_MARKER)
  );
}

export function findKickedOfflineError(error: unknown): { message: string } | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }

  const matched = error.errors.find(isKickedOfflineGraphQLErrorItem);
  if (!matched?.message) {
    return null;
  }

  return { message: matched.message };
}

export const buildProductParam = (products?: ProductEnum[]): string => {
  if (!Array.isArray(products) || products.length === 0) {
    return '';
  }

  return products.join(',');
};
