/** 展示用数量：千分位分隔，空值按 0 处理 */
export const formatCount = (value?: number): string => Number(value ?? 0).toLocaleString('en-US');
