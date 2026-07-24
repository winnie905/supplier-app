export const APPS_COMPANY_NAME = '英耐特-淑女郎(成衣)';

export type AppsEntryKey = 'order_search' | 'placeholder_1' | 'placeholder_2' | 'placeholder_3';

export interface AppsEntry {
  key: AppsEntryKey;
  title: string;
  subtitle: string;
  /** 可跳转的入口；占位项为 false */
  enabled: boolean;
}

export const APPS_ENTRIES: AppsEntry[] = [
  {
    key: 'order_search',
    title: '订单查询',
    subtitle: '进度实时查，交付有保障',
    enabled: true,
  },
];
