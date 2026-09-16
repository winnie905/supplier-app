const PRODUCTION_TYPE_LABELS: Record<string, string> = {
  SP: '现货采购',
};

export const formatProductionType = (value: string): string =>
  PRODUCTION_TYPE_LABELS[value] ?? value;
