/**
 * 递归去掉 GraphQL 查询结果里的 __typename。
 * Apollo 默认会给对象打上该字段，但 Input Object 不允许，提交 mutation 前必须剥离。
 */
export const stripTypename = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => stripTypename(item)) as T;
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === '__typename') continue;
      result[key] = stripTypename(nested);
    }
    return result as T;
  }

  return value;
};
