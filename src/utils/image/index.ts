/** image 子模块 barrel：仅做重导出，不放置具体实现。 */
export type { BlurEstimateResult } from './blurEstimate';
export { estimateImageBlurFast } from './blurEstimate';
export type { ContainScaleLayout } from './layout';
export {
  computeContainScaleLayout,
  getContainLayoutForImage,
  getWidthFitLayoutForImage,
  imagePixelRectToView,
  mapNormRectToContainerFrame,
} from './layout';
export {
  clampDraftRect,
  clampRect,
  createRectFromPoints,
  isEmptyRect,
  normalizeIncomingRect,
} from './mark';
export type { NormalizedUploadImage } from './processing';
export { normalizeImageForUpload, scanBarcodesFromImageUri } from './processing';
