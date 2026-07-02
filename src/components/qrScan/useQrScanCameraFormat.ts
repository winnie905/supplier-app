import { useMemo } from 'react';
import type { CameraDevice } from 'react-native-vision-camera';
import { useCameraFormat } from 'react-native-vision-camera';

import type { QrScanCameraOptions } from '@/components/qrScan/QrScanCamera';

/**
 * 二维码识别画质优先级：
 * 优先 1080p（清晰且实时性能稳定，避免 4K 导致低端机卡顿 / Frame Processor 堆积），
 * 帧率 30fps（24~30fps 利于清晰度）。useCameraFormat 会按顺序就近匹配设备实际支持的格式。
 */
export const QR_SCAN_FORMAT_FILTERS = [
  { videoResolution: { width: 1920, height: 1080 } },
  { fps: 30 },
] as const;

export const QR_SCAN_COVER_CAMERA_OPTIONS = {
  resizeMode: 'cover' as const,
  video: true,
  photo: false,
  audio: false,
  // 关闭原生捏合手势：改由自定义 Pinch 写入单一 zoomShared，与自动变焦协调
  enableZoomGesture: false,
};

/** 高清 cover 模式相机 format 与参数，供扫码页与坐标换算共用 */
export function useQrScanCameraFormat(device: CameraDevice | undefined) {
  const format = useCameraFormat(device, [...QR_SCAN_FORMAT_FILTERS]);

  const { frameW, frameH } = useMemo(() => {
    if (!format) {
      return { frameW: 1920, frameH: 1080 };
    }

    return {
      frameW: format.videoWidth ?? format.photoWidth ?? 1920,
      frameH: format.videoHeight ?? format.photoHeight ?? 1080,
    };
  }, [format]);

  const cameraOptions = useMemo((): QrScanCameraOptions | undefined => {
    if (!format) {
      return undefined;
    }

    return {
      format,
      ...QR_SCAN_COVER_CAMERA_OPTIONS,
    };
  }, [format]);

  return {
    format,
    frameW,
    frameH,
    cameraOptions,
    hasFormat: Boolean(format),
  };
}
