/**
 * 存放图片在容器内的几何布局工具：contain/cover 显示区域计算、
 * 归一化坐标与像素坐标的互转等。
 */
import type { ContainLayout, NormalizedMarkRect } from '@/types/mark';

interface NormRectN {
  nh: number;
  nw: number;
  nx: number;
  ny: number;
}

/** 相册二维码热区等场景：offset + scale 表示 */
export interface ContainScaleLayout {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const getContainLayoutForImage = (
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ContainLayout => {
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    return { height: 0, offX: 0, offY: 0, width: 0 };
  }

  const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    height,
    offX: (containerWidth - width) / 2,
    offY: (containerHeight - height) / 2,
    width,
  };
};

/** 宽度铺满容器，高度按图片比例自适应，并在容器内垂直居中。 */
export const getWidthFitLayoutForImage = (
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ContainLayout => {
  if (!containerWidth || !naturalWidth || !naturalHeight) {
    return { height: 0, offX: 0, offY: 0, width: 0 };
  }

  const width = containerWidth;
  const height = containerWidth * (naturalHeight / naturalWidth);

  return {
    height,
    offX: 0,
    offY: containerHeight ? (containerHeight - height) / 2 : 0,
    width,
  };
};

const isNStyle = (r: NormRectN | NormalizedMarkRect): r is NormRectN => 'nx' in r;

export const mapNormRectToContainerFrame = (
  layout: ContainLayout,
  rect: NormRectN | NormalizedMarkRect,
): { height: number; left: number; top: number; width: number } => {
  if (!layout.width || !layout.height) {
    return { height: 0, left: 0, top: 0, width: 0 };
  }

  if (isNStyle(rect)) {
    return {
      height: rect.nh * layout.height,
      left: layout.offX + rect.nx * layout.width,
      top: layout.offY + rect.ny * layout.height,
      width: rect.nw * layout.width,
    };
  }

  return {
    height: rect.normalizedHeight * layout.height,
    left: layout.offX + rect.normalizedX * layout.width,
    top: layout.offY + rect.normalizedY * layout.height,
    width: rect.normalizedWidth * layout.width,
  };
};

export const computeContainScaleLayout = (
  viewW: number,
  viewH: number,
  imgW: number,
  imgH: number,
): ContainScaleLayout => {
  const layout = getContainLayoutForImage(viewW, viewH, imgW, imgH);
  const scale = layout.width / imgW || 0;

  return {
    offsetX: layout.offX,
    offsetY: layout.offY,
    scale,
  };
};

export const imagePixelRectToView = (
  box: { height: number; width: number; x: number; y: number },
  layout: ContainScaleLayout,
) => ({
  height: box.height * layout.scale,
  width: box.width * layout.scale,
  x: layout.offsetX + box.x * layout.scale,
  y: layout.offsetY + box.y * layout.scale,
});
