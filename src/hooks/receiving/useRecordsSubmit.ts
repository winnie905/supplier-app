import { useToast } from 'design-system-native';

import { EMPTY_FORM_SUBMIT_MESSAGE } from '@/constants/receiving';

interface UseRecordsSubmitParams<T extends { id: string; submitted: boolean }> {
  records: T[];
  editingId: string | undefined;
  setEditingId: (id?: string) => void;
  collapseToFirst: (id?: string) => void;
  /** 车位/尾部提交后允许接口重新灌入；裁床保持原守卫 */
  resetSyncGuards?: () => void;
  refresh: () => Promise<unknown>;
  submit: (targetIds: string[]) => Promise<unknown>;
  /** 防重复提交锁，与页面其他提交动作共用同一个实例 */
  runSubmit: (action: () => Promise<void> | void) => Promise<void>;
  /** 无可提交记录时的提示，默认「不能提交空白表单！」 */
  emptyMessage?: string;
  /** service 抛出的业务错误码 → 提示文案；EMPTY_FORM 已有默认文案 */
  errorMessages?: Record<string, string>;
}

/**
 * 裁床 / 车位 / 尾部记录页共用的提交流程：
 * 挑出待提交记录 → 调 service → 退出编辑态并收起 → 刷新 → 成功提示。
 */
export const useRecordsSubmit = <T extends { id: string; submitted: boolean }>({
  records,
  editingId,
  setEditingId,
  collapseToFirst,
  resetSyncGuards,
  refresh,
  submit,
  runSubmit,
  emptyMessage = EMPTY_FORM_SUBMIT_MESSAGE,
  errorMessages,
}: UseRecordsSubmitParams<T>) => {
  const toast = useToast();
  const resolvedErrorMessages: Record<string, string> = {
    EMPTY_FORM: EMPTY_FORM_SUBMIT_MESSAGE,
    ...errorMessages,
  };

  return () => {
    void runSubmit(async () => {
      const targets = records.filter((record) => !record.submitted || record.id === editingId);
      if (targets.length === 0) {
        toast.show({ title: emptyMessage, duration: 3000 });
        return;
      }
      try {
        await submit(targets.map((record) => record.id));
        setEditingId(undefined);
        collapseToFirst(records[0]?.id);
        resetSyncGuards?.();
        await refresh();
        toast.show({ title: '提交成功', duration: 3000 });
      } catch (error) {
        const message = error instanceof Error ? resolvedErrorMessages[error.message] : undefined;
        if (message) {
          toast.show({ title: message, duration: 3000 });
        }
      }
    });
  };
};
