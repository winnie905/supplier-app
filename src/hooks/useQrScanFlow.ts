import { useIsFocused } from '@react-navigation/native';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import type { CameraDevice, Code, CodeScannerFrame, CodeType } from 'react-native-vision-camera';
import { useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

import {
  SCAN_MULTI_PROTECTION_MS,
  SCAN_SINGLE_CONFIRM_MS,
  SCAN_SINGLE_GAP_TOLERANCE_MS,
  SCAN_STABILIZE_MS,
} from '@/constants/qrScan';
import {
  QR_AUTO_ZOOM_CODE_PRESENT_MS,
  QR_AUTO_ZOOM_HARD_CAP,
  QR_AUTO_ZOOM_IDLE_BEFORE_MS,
  QR_AUTO_ZOOM_LOST_RESET_MS,
  QR_AUTO_ZOOM_SOFT_CAP,
  QR_AUTO_ZOOM_STEP_DWELL_MS,
  QR_AUTO_ZOOM_STEP_FACTORS,
  QR_AUTO_ZOOM_TICK_MS,
  QR_AUTO_ZOOM_TRANSITION_MS,
  QR_GESTURE_ZOOM_COOLDOWN_MS,
} from '@/constants/qrScan';
import { useCameraAccess } from '@/hooks/useCameraAccess';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type QrCodeInfo = Code & {
  boundingBox?: BoundingBox | undefined;
  /** 该码所属扫描帧的实际尺寸（坐标映射以此为准，而非相机视频分辨率） */
  scannerFrame?: { width: number; height: number } | undefined;
};

export interface QrScanObservePayload {
  frame: CodeScannerFrame;
  codes: Code[];
}

export interface UseQrScanFlowParams {
  onBack: () => void;
  onSingle: (codeInfo: QrCodeInfo) => void;
  onMultiple: (codeInfos: QrCodeInfo[]) => void;
  onInvalid: () => void;
  device?: CameraDevice | undefined;
  cameraPaused?: boolean;
  scanPaused?: boolean;
  keepPreviewOnScanLock?: boolean;
  blockedRef?: RefObject<boolean>;
}

// ---------------------------------------------------------------------------
// 扫码状态机（内联，不单独拆 Hook）
// ---------------------------------------------------------------------------

const CODE_TYPES: CodeType[] = ['qr'];

const buildBoundingBox = (item: Code): BoundingBox | undefined => {
  const { frame } = item;
  if (!frame) {
    return undefined;
  }
  return {
    height: frame.height ?? 0,
    width: frame.width ?? 0,
    x: frame.x ?? 0,
    y: frame.y ?? 0,
  };
};

const toQrCodeInfo = (code: Code, frame: CodeScannerFrame): QrCodeInfo => ({
  ...code,
  boundingBox: buildBoundingBox(code),
  scannerFrame: { width: frame.width, height: frame.height },
});

const isValidQrCode = (code: Code): boolean =>
  code.type === 'qr' && typeof code.value === 'string' && code.value.length > 0;

interface ScannerRuntime {
  enable: boolean;
  blockedRef: RefObject<boolean> | undefined;
  onSingle: (codeInfo: QrCodeInfo) => void;
  onMultiple: (codeInfos: QrCodeInfo[]) => void;
  onCodesObserved?: (payload: QrScanObservePayload) => void;
}

/**
 * 扫码核心状态机（仅竖屏、仅 QR）。
 * 单码 400ms 稳定、多码保护 600ms、漏检容差等规则见 {@link SCAN_SINGLE_CONFIRM_MS} 等常量。
 */
function useQrScanCodeScanner({
  enable,
  blockedRef,
  onSingle,
  onMultiple,
  onCodesObserved,
}: ScannerRuntime) {
  const localBlockedRef = useRef(false);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleCandidateKeyRef = useRef<string | null>(null);
  const singleStableSinceRef = useRef(0);
  const lastSingleSeenAtRef = useRef(0);
  const lastMultiAtRef = useRef(0);

  const onSingleRef = useRef(onSingle);
  const onMultipleRef = useRef(onMultiple);
  onSingleRef.current = onSingle;
  onMultipleRef.current = onMultiple;

  const resetSingleCandidate = () => {
    singleCandidateKeyRef.current = null;
    singleStableSinceRef.current = 0;
  };

  const releaseLater = () => {
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current);
    }
    releaseTimerRef.current = setTimeout(() => {
      localBlockedRef.current = false;
    }, SCAN_STABILIZE_MS);
  };

  const triggerSingle = (code: Code, frame: CodeScannerFrame) => {
    localBlockedRef.current = true;
    resetSingleCandidate();
    onSingleRef.current(toQrCodeInfo(code, frame));
    releaseLater();
  };

  const triggerMultiple = (codes: Code[], frame: CodeScannerFrame) => {
    localBlockedRef.current = true;
    onMultipleRef.current(codes.map((c) => toQrCodeInfo(c, frame)));
    releaseLater();
  };

  useEffect(() => {
    if (!enable) {
      resetSingleCandidate();
      lastSingleSeenAtRef.current = 0;
      lastMultiAtRef.current = 0;
      localBlockedRef.current = false;
    }
  }, [enable]);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      resetSingleCandidate();
      lastSingleSeenAtRef.current = 0;
      lastMultiAtRef.current = 0;
      localBlockedRef.current = false;
    };
  }, []);

  return useCodeScanner({
    codeTypes: CODE_TYPES,
    onCodeScanned: (codes, frame) => {
      onCodesObserved?.({ frame, codes });

      if (!enable || blockedRef?.current || localBlockedRef.current) {
        return;
      }

      const now = performance.now();
      const valid = codes.filter(isValidQrCode);
      const count = valid.length;

      if (count >= 2) {
        lastMultiAtRef.current = now;
        resetSingleCandidate();
        triggerMultiple(valid, frame);
        return;
      }

      if (count === 1) {
        lastSingleSeenAtRef.current = now;
        const code = valid[0]!;
        const key = code.value!;

        const inProtection =
          lastMultiAtRef.current > 0 && now - lastMultiAtRef.current < SCAN_MULTI_PROTECTION_MS;

        if (inProtection) {
          singleCandidateKeyRef.current = key;
          singleStableSinceRef.current = now;
          return;
        }

        if (singleCandidateKeyRef.current !== key) {
          singleCandidateKeyRef.current = key;
          singleStableSinceRef.current = now;
          return;
        }

        if (now - singleStableSinceRef.current >= SCAN_SINGLE_CONFIRM_MS) {
          triggerSingle(code, frame);
        }
        return;
      }

      if (
        singleCandidateKeyRef.current != null &&
        now - lastSingleSeenAtRef.current > SCAN_SINGLE_GAP_TOLERANCE_MS
      ) {
        resetSingleCandidate();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// 相机变焦（内联，单一 zoomShared 数据源）
// ---------------------------------------------------------------------------

interface ZoomConfig {
  neutralZoom: number;
  minZoom: number;
  deviceMaxZoom: number;
  softCapZoom: number;
  hardCapZoom: number;
}

function buildZoomConfig(device: CameraDevice | undefined): ZoomConfig {
  const neutralZoom = device?.neutralZoom ?? 1;
  const minZoom = device?.minZoom ?? 1;
  const deviceMaxZoom = device?.maxZoom ?? neutralZoom * QR_AUTO_ZOOM_HARD_CAP;
  const softCapZoom = Math.min(deviceMaxZoom, neutralZoom * QR_AUTO_ZOOM_SOFT_CAP);
  const hardCapZoom = Math.min(deviceMaxZoom, neutralZoom * QR_AUTO_ZOOM_HARD_CAP);
  return { neutralZoom, minZoom, deviceMaxZoom, softCapZoom, hardCapZoom };
}

function useQrScanCameraZoom(device: CameraDevice | undefined, enabled: boolean) {
  const configRef = useRef<ZoomConfig>(buildZoomConfig(device));
  const zoomShared = useSharedValue(configRef.current.neutralZoom);

  const gestureActiveRef = useRef(false);
  const lastGestureEndAtRef = useRef(0);
  const lastDecodeAtRef = useRef(0);
  const decodedSinceRampRef = useRef(false);
  const stepIndexRef = useRef(0);
  const baselineZoomRef = useRef(configRef.current.neutralZoom);
  const autoZoomedRef = useRef(false);
  const lastStepAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setZoomImmediate = (value: number) => {
    zoomShared.value = value;
  };

  const setZoomAnimated = (value: number) => {
    zoomShared.value = withTiming(value, { duration: QR_AUTO_ZOOM_TRANSITION_MS });
  };

  const resetRampState = () => {
    stepIndexRef.current = 0;
    autoZoomedRef.current = false;
    lastStepAtRef.current = 0;
    decodedSinceRampRef.current = false;
    baselineZoomRef.current = configRef.current.neutralZoom;
  };

  const onGestureStart = () => {
    gestureActiveRef.current = true;
    stepIndexRef.current = 0;
    autoZoomedRef.current = false;
  };

  const onGestureEnd = () => {
    gestureActiveRef.current = false;
    lastGestureEndAtRef.current = Date.now();
  };

  const onCodeObserved = ({ codes }: QrScanObservePayload) => {
    const hasValue = codes.some((c) => typeof c.value === 'string' && c.value.length > 0);
    if (hasValue) {
      lastDecodeAtRef.current = Date.now();
      cancelAnimation(zoomShared);
    }
  };

  const freezeZoom = () => {
    cancelAnimation(zoomShared);
  };

  useEffect(() => {
    configRef.current = buildZoomConfig(device);
    resetRampState();
    setZoomImmediate(configRef.current.neutralZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- device identity fields
  }, [device?.id, device?.maxZoom, device?.minZoom, device?.neutralZoom]);

  useEffect(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled) {
      resetRampState();
      setZoomImmediate(configRef.current.neutralZoom);
      return;
    }

    lastStepAtRef.current = Date.now();

    const tick = () => {
      const config = configRef.current;
      const now = Date.now();

      if (
        gestureActiveRef.current ||
        now - lastGestureEndAtRef.current < QR_GESTURE_ZOOM_COOLDOWN_MS
      ) {
        return;
      }

      const sinceDecode = now - lastDecodeAtRef.current;
      const hasCodeNow = lastDecodeAtRef.current > 0 && sinceDecode < QR_AUTO_ZOOM_CODE_PRESENT_MS;

      if (hasCodeNow) {
        decodedSinceRampRef.current = true;
        lastStepAtRef.current = now;
        return;
      }

      if (
        autoZoomedRef.current &&
        decodedSinceRampRef.current &&
        sinceDecode >= QR_AUTO_ZOOM_LOST_RESET_MS
      ) {
        setZoomAnimated(baselineZoomRef.current);
        resetRampState();
        return;
      }

      if (sinceDecode < QR_AUTO_ZOOM_IDLE_BEFORE_MS) {
        return;
      }
      if (now - lastStepAtRef.current < QR_AUTO_ZOOM_STEP_DWELL_MS) {
        return;
      }

      if (stepIndexRef.current === 0) {
        baselineZoomRef.current = zoomShared.value;
      }

      const nextIndex = stepIndexRef.current + 1;
      if (nextIndex >= QR_AUTO_ZOOM_STEP_FACTORS.length) {
        return;
      }

      const factor = QR_AUTO_ZOOM_STEP_FACTORS[nextIndex]!;
      const target = Math.min(
        baselineZoomRef.current * factor,
        config.softCapZoom,
        config.hardCapZoom,
      );

      if (target <= zoomShared.value + 0.001) {
        return;
      }

      stepIndexRef.current = nextIndex;
      autoZoomedRef.current = true;
      setZoomAnimated(target);
      lastStepAtRef.current = now;
    };

    intervalRef.current = setInterval(tick, QR_AUTO_ZOOM_TICK_MS);
    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      resetRampState();
      setZoomImmediate(configRef.current.neutralZoom);
    };
    // setZoom* 仅写 SharedValue，故意不列入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, zoomShared]);

  return {
    zoomShared,
    getZoom: () => zoomShared.value,
    getNeutralZoom: () => configRef.current.neutralZoom,
    freezeZoom,
    onGestureStart,
    onGestureEnd,
    onCodeObserved,
    minZoom: configRef.current.minZoom,
    maxZoom: configRef.current.deviceMaxZoom,
  };
}

// ---------------------------------------------------------------------------
// 扫码流程 Hook（对外入口）
// ---------------------------------------------------------------------------

export function useQrScanFlow({
  onBack,
  onSingle,
  onMultiple,
  onInvalid: _onInvalid,
  device: deviceProp,
  cameraPaused = false,
  scanPaused = false,
  keepPreviewOnScanLock = false,
  blockedRef,
}: UseQrScanFlowParams) {
  const { isCameraGranted, isRequesting } = useCameraAccess();
  const internalDevice = useCameraDevice('back');
  const device = deviceProp ?? internalDevice;
  const isFocused = useIsFocused();

  const [torchOn, setTorchOn] = useState(false);
  const [scannerBlocked, setScannerBlocked] = useState(false);

  const scannerBlockedRef = useRef(false);
  const effectiveBlockedRef = blockedRef ?? scannerBlockedRef;

  const lockScanner = useCallback(() => {
    scannerBlockedRef.current = true;
    setScannerBlocked(true);
  }, []);

  const unlockScanner = useCallback(() => {
    scannerBlockedRef.current = false;
    setScannerBlocked(false);
  }, []);

  useEffect(() => {
    if (isFocused && !blockedRef) {
      unlockScanner();
    }
  }, [blockedRef, isFocused, unlockScanner]);

  const onMultipleThrottled = useThrottledCallback((nextCodeInfos: QrCodeInfo[]) => {
    onMultiple(nextCodeInfos);
  }, 300);

  const onSingleThrottled = useThrottledCallback((codeInfo: QrCodeInfo) => {
    if (effectiveBlockedRef.current) {
      return;
    }
    onSingle(codeInfo);
  }, 300);

  const cameraActive =
    isFocused &&
    Boolean(isCameraGranted && device) &&
    !cameraPaused &&
    (keepPreviewOnScanLock || !scannerBlocked);

  const scanEnabled = cameraActive && !scanPaused && !scannerBlocked;

  const previewSizeRef = useRef({ width: 0, height: 0 });
  const onPreviewLayout = (size: { width: number; height: number }) => {
    previewSizeRef.current = size;
  };
  const getPreviewSize = () => previewSizeRef.current;

  const zoom = useQrScanCameraZoom(device, scanEnabled);

  const codeScanner = useQrScanCodeScanner({
    enable: scanEnabled,
    blockedRef: effectiveBlockedRef,
    onSingle: onSingleThrottled,
    onMultiple: onMultipleThrottled,
    onCodesObserved: zoom.onCodeObserved,
  });

  return {
    device,
    hasCameraAccess: Boolean(isCameraGranted && device),
    isRequesting,
    cameraActive,
    scanEnabled,
    getCameraZoom: zoom.getZoom,
    getCameraNeutralZoom: zoom.getNeutralZoom,
    freezeCameraZoom: zoom.freezeZoom,
    cameraZoomShared: zoom.zoomShared,
    cameraMinZoom: zoom.minZoom,
    cameraMaxZoom: zoom.maxZoom,
    onCameraGestureStart: zoom.onGestureStart,
    onCameraGestureEnd: zoom.onGestureEnd,
    onPreviewLayout,
    getPreviewSize,
    codeScanner,
    torchOn,
    handleBack: onBack,
    handleToggleTorch: () => setTorchOn((prev) => !prev),
    lockScanner,
    unlockScanner,
    scannerBlockedRef,
  };
}
