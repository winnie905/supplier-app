import type { ToastApi } from 'design-system-native';

export interface SubmitExceptionReportParams {
  exceptionTypes: string[];
  toast: ToastApi;
  /** 返回错误文案则中止；不返回/返回 null 则继续 */
  precheck?: () => string | null | undefined;
  submit: () => Promise<void>;
  closeExceptionSheet: () => void;
  resetExceptionForm: () => void;
  afterSuccess?: () => void | Promise<void>;
}

/**
 * 物料/裁床异常提交共用流程：校验类型 → 调接口 → 关 sheet → 刷新回调 → 成功 toast。
 * 业务校验与接口入参仍由调用方决定。
 */
export const submitExceptionReport = async ({
  exceptionTypes,
  toast,
  precheck,
  submit,
  closeExceptionSheet,
  resetExceptionForm,
  afterSuccess,
}: SubmitExceptionReportParams): Promise<void> => {
  const precheckError = precheck?.();
  if (precheckError) {
    toast.show({ title: precheckError, duration: 3000 });
    return;
  }
  if (exceptionTypes.length === 0) {
    toast.show({ title: '请选择异常类型', duration: 3000 });
    return;
  }

  await submit();
  closeExceptionSheet();
  resetExceptionForm();
  await afterSuccess?.();
  toast.show({ title: '异常已提交', duration: 3000 });
};
