/**
 * 存放相册选图扫码相关工具。
 */
import { Image } from 'react-native';

import type { QrScanDetectedCode } from '@/components/qrScan/types';
import type { ImageQrDetectionResult, QrCodeCandidate } from '@/types';
import { QrCodeCandidateModeEnum } from '@/types';
import { computeContainScaleLayout, imagePixelRectToView } from '@/utils/image/layout';

export function isScannableAlbumDetection(detection: ImageQrDetectionResult): boolean {
  return typeof detection.rawValue === 'string' && detection.rawValue.trim().length > 0;
}

export type AlbumQrScanDispatch =
  | { kind: 'none' }
  | { kind: 'single'; detection: ImageQrDetectionResult }
  | { kind: 'multiple'; detections: ImageQrDetectionResult[] };

export function classifyAlbumDetections(detections: ImageQrDetectionResult[]): AlbumQrScanDispatch {
  const scannable = detections.filter(isScannableAlbumDetection);

  if (scannable.length === 0) {
    return { kind: 'none' };
  }

  if (scannable.length === 1) {
    return { kind: 'single', detection: scannable[0]! };
  }

  return { kind: 'multiple', detections: scannable };
}

export function buildCandidateFromAlbumDetection(
  detection: ImageQrDetectionResult,
): QrCodeCandidate | null {
  const rawValue = detection.rawValue?.trim();

  if (!rawValue) {
    return null;
  }

  return {
    rawValue,
    barcodeType: 'qr',
    mode: QrCodeCandidateModeEnum.SINGLE,
    id: 0,
    ...(detection.boundingBox ? { boundingBox: detection.boundingBox } : {}),
    displayText: detection.displayValue,
  };
}

export function buildAlbumCandidatesForReview(
  detections: ImageQrDetectionResult[],
): QrCodeCandidate[] {
  return detections.map((detection, index) => {
    const parsed = buildCandidateFromAlbumDetection(detection);
    if (parsed) {
      return parsed;
    }

    return {
      ...(detection.boundingBox ? { boundingBox: detection.boundingBox } : {}),
      rawValue: detection.rawValue,
      barcodeType: 'qr' as const,
      displayText: detection.displayValue,
      mode: QrCodeCandidateModeEnum.SINGLE,
      id: -(index + 1),
    };
  });
}

export interface AlbumDetectedCode extends QrScanDetectedCode {
  candidate: QrCodeCandidate;
}

const albumImageSizeCache = new Map<string, { height: number; width: number }>();
const albumCodesLayoutCache = new Map<string, AlbumDetectedCode[]>();

const buildAlbumLayoutCacheKey = (
  uri: string,
  candidates: QrCodeCandidate[],
  viewW: number,
  viewH: number,
) =>
  [
    uri,
    viewW,
    viewH,
    candidates.map((candidate) => `${candidate.rawValue}:${candidate.barcodeType}`).join('|'),
  ].join('::');

async function getAlbumImageSize(
  uri: string,
  fallbackW: number,
  fallbackH: number,
): Promise<{ height: number; width: number }> {
  const cached = albumImageSizeCache.get(uri);
  if (cached) {
    return cached;
  }

  const size = await new Promise<{ height: number; width: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  }).catch(() => ({ width: fallbackW, height: fallbackH }));

  albumImageSizeCache.set(uri, size);
  return size;
}

export async function mapAlbumCodesToScreen(
  uri: string,
  candidates: QrCodeCandidate[],
  viewW: number,
  viewH: number,
): Promise<AlbumDetectedCode[]> {
  const layoutCacheKey = buildAlbumLayoutCacheKey(uri, candidates, viewW, viewH);
  const cachedLayout = albumCodesLayoutCache.get(layoutCacheKey);
  if (cachedLayout) {
    return cachedLayout;
  }

  const { width: imgW, height: imgH } = await getAlbumImageSize(uri, viewW, viewH);
  const layout = computeContainScaleLayout(viewW, viewH, imgW, imgH);

  const mapped = candidates.flatMap((candidate, index) => {
    if (!candidate.boundingBox) {
      return [];
    }

    const rect = imagePixelRectToView(candidate.boundingBox, layout);

    return [
      {
        id: `${candidate.barcodeType}-${candidate.rawValue}-${index}`,
        candidate,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    ];
  });

  albumCodesLayoutCache.set(layoutCacheKey, mapped);
  return mapped;
}

export function clearAlbumCodesLayoutCache(uri?: string) {
  if (!uri) {
    albumImageSizeCache.clear();
    albumCodesLayoutCache.clear();
    return;
  }

  albumImageSizeCache.delete(uri);

  for (const key of albumCodesLayoutCache.keys()) {
    if (key.startsWith(`${uri}::`)) {
      albumCodesLayoutCache.delete(key);
    }
  }
}
