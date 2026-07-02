import type { AlbumPhase } from '@/types';

/** 扫码页多码 marker 基础坐标 */
export interface QrScanDetectedCode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 相册复核：图片 URI + 候选列表（业务层注入候选类型） */
export interface QrScanAlbumReviewState<TCandidate> {
  candidates: TCandidate[];
  uri: string;
}

export interface QrScanPageAlbumState<TCandidate> {
  albumPhase: AlbumPhase;
  albumImageUri: string | null;
  albumReview: QrScanAlbumReviewState<TCandidate> | null;
  onSelectAlbumCandidate: (candidate: TCandidate) => void;
}

export interface QrScanPageTexts {
  back: string;
  scanRequestingPermission: string;
  scanNoPermission: string;
  scanTip: string;
  scanTorch: string;
  album?: string;
  albumAnalyzing?: string;
  albumOpening?: string;
}
