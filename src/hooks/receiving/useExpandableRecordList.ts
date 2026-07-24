import { useCallback, useRef, useState } from 'react';

/** 记录页共用：展开/编辑态 + 首次进入只展开第一条 */
export const useExpandableRecordList = () => {
  const didInitExpandRef = useRef(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const ensureExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /** 首次有数据时展开第一条；`alsoEdit` 时同时进入编辑 */
  const initExpandFirst = useCallback((firstId: string, alsoEdit = false) => {
    if (didInitExpandRef.current) return;
    didInitExpandRef.current = true;
    setExpandedIds([firstId]);
    if (alsoEdit) setEditingId(firstId);
  }, []);

  const collapseToFirst = useCallback((firstId?: string) => {
    setExpandedIds(firstId ? [firstId] : []);
  }, []);

  return {
    expandedIds,
    setExpandedIds,
    editingId,
    setEditingId,
    toggleExpand,
    ensureExpanded,
    initExpandFirst,
    collapseToFirst,
  };
};
