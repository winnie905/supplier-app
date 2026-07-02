/**
 * 存放相机实时扫码的几何与检测工具：帧坐标到预览视图的映射、
 * 多码 overlay 的构建与标识生成等。
 */
import { Platform } from 'react-native';
import type { Code } from 'react-native-vision-camera';

import type { QrCodeInfo } from '@/hooks/useQrScanFlow';

export interface FrameDimensions {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface QrPreviewProjectionOptions {
  frameW: number;
  frameH: number;
  viewW: number;
  viewH: number;
  /** 识别瞬间的相机 zoom，用于修正数字变焦中心裁剪 */
  zoom?: number;
  /** 设备 neutralZoom，默认 1 */
  neutralZoom?: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface ContentSpace {
  contentH: number;
  contentW: number;
  points: Point2D[];
}

function getRawPoints(code: Code): Point2D[] {
  if (code.corners && code.corners.length >= 3) {
    return code.corners.map((p) => ({ x: p.x, y: p.y }));
  }

  if (code.frame) {
    return [
      { x: code.frame.x, y: code.frame.y },
      { x: code.frame.x + code.frame.width, y: code.frame.y },
      { x: code.frame.x + code.frame.width, y: code.frame.y + code.frame.height },
      { x: code.frame.x, y: code.frame.y + code.frame.height },
    ];
  }

  return [];
}

/**
 * 将扫码帧坐标统一到竖屏内容空间（与 cover 预览方向一致）。
 *
 * - iOS：AVMetadata 在 landscape 传感器空间，需旋转点坐标。
 * - Android：ML Kit InputImage 已按 rotation 转正，坐标与 frame 同空间，不做点旋转；
 *   内容宽高沿用历史映射 contentW=frameH、contentH=frameW，与预览 cover 一致。
 */
function getContentSpace(code: Code, frameW: number, frameH: number): ContentSpace | null {
  const raw = getRawPoints(code);
  if (raw.length === 0) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return {
      points: raw.map((p) => ({ x: frameH - p.y, y: p.x })),
      contentW: frameH,
      contentH: frameW,
    };
  }

  return { points: raw, contentW: frameH, contentH: frameW };
}

/** Android 预览变焦由 CameraX 处理，分析帧坐标无需再做数字裁剪修正。 */
function getProjectionZoomRatio(zoom: number, neutralZoom: number): number {
  if (Platform.OS !== 'ios') {
    return 1;
  }

  const ratio = zoom / neutralZoom;
  return ratio > 1.001 ? ratio : 1;
}

/** 内容空间坐标 → 预览视图坐标（cover + 数字变焦中心裁剪）。 */
function mapContentPointToView(
  point: Point2D,
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number,
  zoomRatio: number,
): Point2D {
  const safeZoom = zoomRatio > 1.001 ? zoomRatio : 1;
  const visibleW = contentW / safeZoom;
  const visibleH = contentH / safeZoom;
  const visibleLeft = (contentW - visibleW) / 2;
  const visibleTop = (contentH - visibleH) / 2;

  const vx = point.x - visibleLeft;
  const vy = point.y - visibleTop;

  const scale = Math.max(viewW / visibleW, viewH / visibleH);
  const cropX = (visibleW * scale - viewW) / 2;
  const cropY = (visibleH * scale - viewH) / 2;

  return {
    x: vx * scale - cropX,
    y: vy * scale - cropY,
  };
}

export function projectQrCodeToPreview(
  code: Code,
  options: QrPreviewProjectionOptions,
): FrameDimensions | null {
  const { frameW, frameH, viewW, viewH, zoom = 1, neutralZoom = 1 } = options;

  if (frameW <= 0 || frameH <= 0 || viewW <= 0 || viewH <= 0) {
    return null;
  }

  const contentSpace = getContentSpace(code, frameW, frameH);
  if (!contentSpace) {
    return null;
  }

  const zoomRatio = getProjectionZoomRatio(zoom, neutralZoom);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of contentSpace.points) {
    const mapped = mapContentPointToView(
      point,
      contentSpace.contentW,
      contentSpace.contentH,
      viewW,
      viewH,
      zoomRatio,
    );
    minX = Math.min(minX, mapped.x);
    minY = Math.min(minY, mapped.y);
    maxX = Math.max(maxX, mapped.x);
    maxY = Math.max(maxY, mapped.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export interface PreviewViewSize {
  viewH: number;
  viewW: number;
  zoom?: number;
  neutralZoom?: number;
}

export function buildLiveDetectedCodes<TCode extends { id: string }>(
  codeInfos: QrCodeInfo[],
  options: PreviewViewSize,
  toDetectedCode: (codeInfo: QrCodeInfo, index: number, screenBox: FrameDimensions) => TCode | null,
): TCode[] {
  const codes: TCode[] = [];

  codeInfos.forEach((codeInfo, index) => {
    const scannerFrame = codeInfo.scannerFrame;
    if (!codeInfo.value || !scannerFrame) {
      return;
    }

    const screenBox = projectQrCodeToPreview(codeInfo, {
      frameW: scannerFrame.width,
      frameH: scannerFrame.height,
      viewW: options.viewW,
      viewH: options.viewH,
      zoom: options.zoom ?? 1,
      neutralZoom: options.neutralZoom ?? 1,
    });
    if (!screenBox) {
      return;
    }

    const item = toDetectedCode(codeInfo, index, screenBox);
    if (item) {
      codes.push(item);
    }
  });

  return codes;
}

export function buildDetectedCodeId(value: string, index: number, box: FrameDimensions): string {
  const cx = Math.round(box.x + box.width / 2);
  const cy = Math.round(box.y + box.height / 2);
  return `${value}#${index}@${cx},${cy}`;
}
