export interface ProductionQrParams {
  productionOrderCode: string;
  color: string;
}

const readParam = (source: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

/** 从扫码内容解析生产单号与颜色（缺失任一字段则返回 null） */
export const parseProductionQrContent = (content: string): ProductionQrParams | null => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const productionOrderCode = readParam(parsed, 'productionOrderCode', 'orderNo', 'orderCode');
      const color = readParam(parsed, 'color');
      if (!productionOrderCode || !color) return null;
      return { productionOrderCode, color };
    } catch {
      return null;
    }
  }

  const tryQueryParams = (query: string) => {
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
    const productionOrderCode =
      params.get('productionOrderCode')?.trim() ??
      params.get('orderNo')?.trim() ??
      params.get('orderCode')?.trim() ??
      '';
    const color = params.get('color')?.trim() ?? '';
    if (!productionOrderCode || !color) return null;
    return { productionOrderCode, color };
  };

  if (trimmed.includes('?')) {
    const queryIndex = trimmed.indexOf('?');
    const fromQuery = tryQueryParams(trimmed.slice(queryIndex));
    if (fromQuery) return fromQuery;
  }

  if (trimmed.includes('productionOrderCode=') || trimmed.includes('color=')) {
    const fromQuery = tryQueryParams(trimmed);
    if (fromQuery) return fromQuery;
  }

  if (trimmed.includes('|')) {
    const [productionOrderCode, color] = trimmed.split('|').map((part) => part.trim());
    if (!productionOrderCode || !color) return null;
    return { productionOrderCode, color };
  }

  return null;
};
