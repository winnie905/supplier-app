import type { FactoryException } from '@/types/receiving';

/** 从待回复异常记录汇总「异常上报时勾选的异常类型」，供订单卡左上角标签展示 */
export const formatPendingExceptionCornerTag = (
  exceptions: FactoryException[],
  /** 异常上报可选类型；传入后只展示落在选项内的类型 */
  allowedTypes: readonly string[],
): string | undefined => {
  const pending = exceptions.filter((item) => item.status === 'pending');
  if (pending.length === 0) return undefined;

  const allowed = new Set(allowedTypes);
  const labels = pending.flatMap((item) =>
    item.type
      .split(/[、,，]/)
      .map((part) => part.trim())
      .filter((part) => allowed.has(part)),
  );
  const unique = [...new Set(labels)];
  return unique.length > 0 ? unique.join('、') : undefined;
};
