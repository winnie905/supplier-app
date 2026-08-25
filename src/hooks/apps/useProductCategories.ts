import { useCallback, useEffect, useState } from 'react';

import { getSystemCategories } from '@/services/config/configService';
import type { SystemCategory } from '@/types/systemConfig';
import { getCategoryLabel as resolveCategoryLabel } from '@/utils/apps/categoryLabel';

/** 订单查询等：加载 getSystemConfig.categories，并提供 category → 展示文案 */
export const useProductCategories = () => {
  const [categories, setCategories] = useState<SystemCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getSystemCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getCategoryLabel = useCallback(
    (categoryKey?: string) => resolveCategoryLabel(categoryKey, categories),
    [categories],
  );

  return { categories, getCategoryLabel };
};
