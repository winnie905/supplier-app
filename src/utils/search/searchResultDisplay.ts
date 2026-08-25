/**
 * 收发管理 / 订单查询搜索结果共用的首行命中与二三行展示规则。
 * 首行只展示大货款号 / 客户PO / 品牌之一（不展示设计款号）。
 */

export type SearchMatchField = 'productCode' | 'customerPO' | 'brand';

export interface SearchResultMatchFields {
  productCode: string;
  customerPO: string;
  brand: string;
  /** 收发管理按色展示；订单查询可不传 */
  color?: string;
}

/**
 * 匹配优先级与搜索框提示一致：大货款号 > 客户PO > 品牌。
 */
export const resolveSearchMatchField = (
  fields: Pick<SearchResultMatchFields, 'productCode' | 'customerPO' | 'brand'>,
  keyword: string,
): SearchMatchField => {
  const q = keyword.trim().toLowerCase();
  if (!q) return 'productCode';
  if (fields.productCode.toLowerCase().includes(q)) return 'productCode';
  if (fields.customerPO.toLowerCase().includes(q)) return 'customerPO';
  if (fields.brand.toLowerCase().includes(q)) return 'brand';
  return 'productCode';
};

export const getSearchResultDisplay = (
  fields: SearchResultMatchFields,
  keyword: string,
): {
  match: SearchMatchField;
  /** 首行纯文本，用于高亮展示与回填搜索框 */
  title: string;
  secondLeft: string;
  thirdLine: string;
  colorLabel?: string;
} => {
  const match = resolveSearchMatchField(fields, keyword);

  let title = fields.productCode;
  let secondLeft = `客户PO：${fields.customerPO}`;
  let thirdLine = `品牌：${fields.brand}`;

  if (match === 'brand') {
    title = fields.brand;
    secondLeft = `大货款号：${fields.productCode}`;
    thirdLine = `客户PO：${fields.customerPO}`;
  } else if (match === 'customerPO') {
    title = fields.customerPO;
    secondLeft = `大货款号：${fields.productCode}`;
    thirdLine = `品牌：${fields.brand}`;
  }

  return {
    match,
    title,
    secondLeft,
    thirdLine,
    ...(fields.color ? { colorLabel: `颜色：${fields.color}` } : {}),
  };
};

/** 收发管理选中回填：大货款号/颜色/品牌 */
export const formatSelectedSearchBarValue = (
  fields: Pick<SearchResultMatchFields, 'productCode' | 'color' | 'brand'>,
): string => `${fields.productCode}/${fields.color ?? ''}/${fields.brand}`;

/** 订单查询选中回填：大货款号/品牌（不含颜色） */
export const formatOrderSearchBarValue = (
  fields: Pick<SearchResultMatchFields, 'productCode' | 'brand'>,
): string => `${fields.productCode}/${fields.brand}`;
