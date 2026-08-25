/** 本地日历日，格式 YYYY-MM-DD */
export const todayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** 截取日期部分为 YYYY-MM-DD；无法识别则原样返回 */
export const toDateOnly = (value?: string): string => {
  if (!value) return '';
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? value;
};

/** 展示用日期：YYYY/MM/DD */
export const formatDateSlash = (value?: string): string => {
  const dateOnly = toDateOnly(value);
  return dateOnly ? dateOnly.replace(/-/g, '/') : '';
};

/** 展示用日期时间（本地时区，24 小时制） */
export const formatDateTime = (value?: string): string => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
};
