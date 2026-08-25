import type { FactoryException } from '@/types/receiving';

const splitExceptionTypes = (type: string, allowed: ReadonlySet<string>): string[] =>
  type
    .split(/[、,，]/)
    .map((part) => part.trim())
    .filter((part) => allowed.has(part));

/** 从待回复异常记录汇总「异常上报时勾选的异常类型」，供订单卡左上角标签展示 */
export const formatPendingExceptionCornerTag = (
  exceptions: FactoryException[],
  /** 异常上报可选类型；传入后只展示落在选项内的类型 */
  allowedTypes: readonly string[],
): string | undefined => {
  const pending = exceptions.filter((item) => item.status === 'pending');
  if (pending.length === 0) return undefined;

  const allowed = new Set(allowedTypes);
  const labels = pending.flatMap((item) => splitExceptionTypes(item.type, allowed));
  const unique = [...new Set(labels)];
  return unique.length > 0 ? unique.join('、') : undefined;
};

/**
 * 按物料 id 汇总待回复异常类型（多条异常合并去重），供料卡片右上角展示。
 * 无 relatedItemIds 的异常不挂到具体料上。
 */
export const formatPendingExceptionTypesByItemId = (
  exceptions: FactoryException[],
  allowedTypes: readonly string[],
): Record<string, string> => {
  const allowed = new Set(allowedTypes);
  const labelsByItem = new Map<string, string[]>();

  for (const record of exceptions) {
    if (record.status !== 'pending' || !record.relatedItemIds?.length) continue;
    const labels = splitExceptionTypes(record.type, allowed);
    if (labels.length === 0) continue;

    for (const itemId of record.relatedItemIds) {
      const existing = labelsByItem.get(itemId) ?? [];
      labelsByItem.set(itemId, existing);
      for (const label of labels) {
        if (!existing.includes(label)) existing.push(label);
      }
    }
  }

  const result: Record<string, string> = {};
  for (const [itemId, labels] of labelsByItem) {
    if (labels.length > 0) result[itemId] = labels.join('、');
  }
  return result;
};
