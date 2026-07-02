/** qrScan 子模块 barrel：仅做重导出，不放置具体实现。 */
export {
  type AlbumDetectedCode,
  type AlbumQrScanDispatch,
  buildAlbumCandidatesForReview,
  buildCandidateFromAlbumDetection,
  classifyAlbumDetections,
  clearAlbumCodesLayoutCache,
  isScannableAlbumDetection,
  mapAlbumCodesToScreen,
} from './album';
export {
  buildDetectedCodeId,
  buildLiveDetectedCodes,
  type FrameDimensions,
  type PreviewViewSize,
  projectQrCodeToPreview,
  type QrPreviewProjectionOptions,
} from './camera';
