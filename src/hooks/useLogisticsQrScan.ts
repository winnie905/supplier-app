import { useMemo } from 'react';

export const useLogisticsQrScanTexts = () =>
  useMemo(
    () => ({
      back: '返回',
      scanRequestingPermission: '正在申请相机权限…',
      scanNoPermission: '未获得相机权限，无法进行扫码',
      scanTip: '请将二维码放入框内',
      scanTorch: '轻触照亮',
      album: '相册',
      albumAnalyzing: '正在识别二维码…',
      albumOpening: '正在打开相册…',
      multiCodeHint: '检测到多个二维码，请点击选择',
    }),
    [],
  );
