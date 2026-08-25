import { useCallback, useEffect, useRef, useState } from 'react';

import { useExpandableRecordList } from '@/hooks/receiving/useExpandableRecordList';

interface UseSyncedExpandableRecordsParams<T extends { id: string }, TData> {
  data: TData | null | undefined;
  /** 从接口数据取出记录列表 */
  getApiRecords: (data: TData) => T[];
  /** 同步后排序（如最新在前） */
  sortRecords?: (records: T[]) => T[];
  /**
   * 接口列表需补本地草稿时返回补全后的列表；返回 null 表示不补。
   * 内部用 seedOnce 保证同一会话只补一次。
   */
  ensureSeed?: (records: T[], seedOnce: () => boolean) => T[] | null;
  /** 首次展开第一条时是否同时进入编辑 */
  alsoEditFirst?: (first: T) => boolean;
  /** persist 时是否同步写入 editingId（裁床/尾部需要，车位不需要） */
  persistEditingId?: boolean;
  /** 接口灌入时是否清空 editingId（尾部需要，裁床保持原编辑态） */
  clearEditingOnSync?: boolean;
}

/**
 * 裁/车/尾共用：接口记录同步到页面内存草稿 + 展开/编辑态。
 * 同一份 API key 重复触发时保留未提交草稿。
 */
export const useSyncedExpandableRecords = <T extends { id: string }, TData>({
  data,
  getApiRecords,
  sortRecords,
  ensureSeed,
  alsoEditFirst,
  persistEditingId = false,
  clearEditingOnSync = false,
}: UseSyncedExpandableRecordsParams<T, TData>) => {
  const expandable = useExpandableRecordList();
  const { initExpandFirst, setEditingId } = expandable;

  const [records, setRecords] = useState<T[]>([]);
  const lastApiKeyRef = useRef<string | null>(null);
  const seededRef = useRef(false);

  const persistRecords = useCallback(
    (next: T[], editing?: string) => {
      setRecords(next);
      if (persistEditingId) {
        setEditingId(editing);
      }
    },
    [persistEditingId, setEditingId],
  );

  const seedOnce = useCallback(() => {
    if (seededRef.current) return false;
    seededRef.current = true;
    return true;
  }, []);

  useEffect(() => {
    if (!data) return;

    const apiRecords = getApiRecords(data);
    const apiKey = `${apiRecords.map((item) => item.id).join(',')}|${apiRecords.length}`;
    // 同一份接口数据重复触发时，保留页面内存中的未提交草稿
    if (lastApiKeyRef.current === apiKey && records.length > 0) {
      return;
    }
    lastApiKeyRef.current = apiKey;

    let next = sortRecords ? sortRecords(apiRecords) : [...apiRecords];
    const seeded = ensureSeed?.(next, seedOnce);
    if (seeded) next = seeded;

    setRecords(next);
    if (clearEditingOnSync) {
      setEditingId(undefined);
    }

    if (next.length > 0) {
      const first = next[0]!;
      initExpandFirst(first.id, alsoEditFirst?.(first) ?? false);
    }
  }, [
    alsoEditFirst,
    clearEditingOnSync,
    data,
    ensureSeed,
    getApiRecords,
    initExpandFirst,
    records.length,
    seedOnce,
    setEditingId,
    sortRecords,
  ]);

  /** 提交成功后清空 API key / seed 守卫，允许重新从接口灌入 */
  const resetSyncGuards = useCallback(() => {
    lastApiKeyRef.current = null;
    seededRef.current = false;
  }, []);

  return {
    records,
    setRecords,
    persistRecords,
    resetSyncGuards,
    ...expandable,
  };
};
