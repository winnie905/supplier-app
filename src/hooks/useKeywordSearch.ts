import { useCallback, useRef, useState } from 'react';

/**
 * 关键字搜索：带序号守卫，避免快速输入时旧请求覆盖新结果。
 */
export const useKeywordSearch = <T>(fetcher: (keyword: string) => Promise<T[]>) => {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchSeqRef = useRef(0);

  const search = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      const seq = ++searchSeqRef.current;
      setLoading(true);
      try {
        const list = await fetcher(trimmed);
        if (seq !== searchSeqRef.current) return;
        setResults(list);
        setSearched(true);
      } finally {
        if (seq === searchSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [fetcher],
  );

  return { results, loading, searched, search };
};
