import type { SystemCategory } from '@/types/systemConfig';

/** 对齐 erp-web：未删除用 fullName 去 `/`；已删除保留 fullName（含 `/`）或 name */
const formatCategoryFullName = (fullName?: string) => fullName?.replace(/\//g, '') ?? '';

/**
 * 按 templateDesign.category（value）匹配 getSystemConfig.categories。
 * 与 erp-web 生产单列表 getCategoryLabel 一致。
 */
export const getCategoryLabel = (
  categoryKey: string | undefined,
  categories: readonly SystemCategory[],
): string => {
  if (!categoryKey) return '';
  const item = categories.find((category) => category.value === categoryKey);
  if (!item) return categories.length === 0 ? categoryKey : '-';
  return item.isDeleted
    ? item.fullName.trim()
      ? item.fullName
      : item.name
    : formatCategoryFullName(item.fullName);
};
