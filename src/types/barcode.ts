import type { QrBoundingBox } from '@/types/workspace';

export type QrDetectionSource = 'camera' | 'album';

/** 相册/静态图识别统一结构；boundingBox 为图片像素坐标（若底层库未返回则为 undefined） */
export interface ImageQrDetectionResult {
  boundingBox?: QrBoundingBox;
  cornerPoints?: { x: number; y: number }[];
  displayValue: string;
  rawValue: string;
  sourceType: QrDetectionSource;
}

export type AlbumPhase = 'analyzing' | 'idle' | 'picking';
