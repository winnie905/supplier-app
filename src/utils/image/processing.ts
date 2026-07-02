/**
 * 存放本地图片文件的读写与识别：静态图条码/二维码检测、
 * 上传前的格式转换与元数据处理等。
 */
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import { Image } from 'react-native';
import ImageResizer from 'react-native-image-resizer';

import type { ImageQrDetectionResult, QrBoundingBox } from '@/types';
import { isRecord, toFiniteNumber } from '@/utils/core';

interface PointLike {
  x?: unknown;
  y?: unknown;
}

interface RectLike {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;

  left?: unknown;
  top?: unknown;
  right?: unknown;
  bottom?: unknown;

  origin?: unknown;
  size?: unknown;
}

interface BarcodeGeometryLike {
  /**
   * 不同 RN 封装版本可能字段名不同。
   * 这里做兼容读取。
   */
  frame?: unknown;
  boundingBox?: unknown;
  bounds?: unknown;
  cornerPoints?: unknown;
  corners?: unknown;
}

const normalizeRectFromXywh = (rect: RectLike): QrBoundingBox | null => {
  const x = toFiniteNumber(rect.x);
  const y = toFiniteNumber(rect.y);
  const width = toFiniteNumber(rect.width);
  const height = toFiniteNumber(rect.height);

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

const normalizeRectFromLTRB = (rect: RectLike): QrBoundingBox | null => {
  const left = toFiniteNumber(rect.left);
  const top = toFiniteNumber(rect.top);
  const right = toFiniteNumber(rect.right);
  const bottom = toFiniteNumber(rect.bottom);

  if (left === null || top === null || right === null || bottom === null) {
    return null;
  }

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x: left,
    y: top,
    width,
    height,
  };
};

const normalizeRectFromOriginSize = (rect: RectLike): QrBoundingBox | null => {
  if (!isRecord(rect.origin) || !isRecord(rect.size)) {
    return null;
  }

  const x = toFiniteNumber(rect.origin.x);
  const y = toFiniteNumber(rect.origin.y);
  const width = toFiniteNumber(rect.size.width);
  const height = toFiniteNumber(rect.size.height);

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

const normalizeRectLike = (value: unknown): QrBoundingBox | null => {
  if (!isRecord(value)) {
    return null;
  }

  const rect = value as RectLike;

  /**
   * 兼容格式一：
   * { x, y, width, height }
   */
  const xywh = normalizeRectFromXywh(rect);
  if (xywh) {
    return xywh;
  }

  /**
   * 兼容格式二：
   * { left, top, right, bottom }
   */
  const ltrb = normalizeRectFromLTRB(rect);
  if (ltrb) {
    return ltrb;
  }

  /**
   * 兼容格式三：
   * { origin: { x, y }, size: { width, height } }
   */
  return normalizeRectFromOriginSize(rect);
};

const normalizeRectFromCornerPoints = (value: unknown): QrBoundingBox | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const points = value
    .map((item): { x: number; y: number } | null => {
      if (!isRecord(item)) {
        return null;
      }

      const point = item as PointLike;
      const x = toFiniteNumber(point.x);
      const y = toFiniteNumber(point.y);

      if (x === null || y === null) {
        return null;
      }

      return { x, y };
    })
    .filter((item): item is { x: number; y: number } => Boolean(item));

  if (points.length === 0) {
    return null;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) {
    return null;
  }

  /**
   * cornerPoints 可能是旋转后的四个角点。
   * 这里取外接矩形，方便后续在图片上放置绿色圆点或热区。
   */
  return {
    x: minX,
    y: minY,
    width,
    height,
  };
};

const getBarcodeBoundingBox = (barcode: unknown): QrBoundingBox | undefined => {
  if (!isRecord(barcode)) {
    return undefined;
  }

  const item = barcode as BarcodeGeometryLike;

  /**
   * 优先读取 frame。
   * VisionCamera 的实时扫码通常叫 frame，
   * 某些 ML Kit RN 封装也可能沿用类似字段。
   */
  const frameRect = normalizeRectLike(item.frame);
  if (frameRect) {
    return frameRect;
  }

  /**
   * 其次读取 boundingBox。
   * ML Kit 原生概念里常见的是 boundingBox。
   */
  const boundingBoxRect = normalizeRectLike(item.boundingBox);
  if (boundingBoxRect) {
    return boundingBoxRect;
  }

  /**
   * 再兼容 bounds。
   */
  const boundsRect = normalizeRectLike(item.bounds);
  if (boundsRect) {
    return boundsRect;
  }

  /**
   * 最后尝试通过 cornerPoints / corners 计算外接矩形。
   */
  const cornerPointsRect = normalizeRectFromCornerPoints(item.cornerPoints);
  if (cornerPointsRect) {
    return cornerPointsRect;
  }

  const cornersRect = normalizeRectFromCornerPoints(item.corners);
  if (cornersRect) {
    return cornersRect;
  }

  return undefined;
};

const getBarcodeRawValue = (barcode: unknown): string => {
  if (!isRecord(barcode)) {
    return '';
  }

  /**
   * 当前你的代码用的是 item.value。
   * 这里顺手兼容 rawValue / displayValue，避免不同平台字段名不一致。
   */
  const value = barcode.value ?? barcode.rawValue ?? barcode.displayValue;

  return typeof value === 'string' ? value : '';
};

const buildDisplayValue = (rawValue: string): string =>
  rawValue.length > 48 ? `${rawValue.slice(0, 48)}…` : rawValue;

/**
 * 相册静态图二维码识别。
 *
 * 返回值中的 boundingBox 是“原图像素坐标”，不是屏幕坐标。
 * 后续在 AlbumQrReviewOverlay 中需要通过：
 *
 * imagePixelRectToView(boundingBox, containLayout)
 *
 * 转换成 Image 组件中的显示坐标。
 */
export const scanBarcodesFromImageUri = async (
  imageUri: string,
): Promise<ImageQrDetectionResult[]> => {
  const barcodes = await BarcodeScanning.scan(imageUri);
  return barcodes
    .map((item): ImageQrDetectionResult | null => {
      const rawValue = getBarcodeRawValue(item);

      /**
       * 没有 rawValue 的结果没有业务意义，直接丢弃。
       */
      if (!rawValue) {
        return null;
      }

      const boundingBox = getBarcodeBoundingBox(item);

      return {
        ...(boundingBox ? { boundingBox } : {}),
        displayValue: buildDisplayValue(rawValue),
        rawValue,
        sourceType: 'album',
      };
    })
    .filter((item): item is ImageQrDetectionResult => Boolean(item));
};

const UPLOAD_MAX_EDGE = 4096;
const UPLOAD_JPEG_QUALITY = 95;

const getImageSizeAsync = (uri: string): Promise<{ height: number; width: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });

export interface NormalizedUploadImage {
  fileName?: string;
  type: string;
  uri: string;
}

/** 将 EXIF Orientation 烘焙进像素后输出 JPEG */
export async function normalizeImageForUpload(uri: string): Promise<NormalizedUploadImage> {
  const { width, height } = await getImageSizeAsync(uri);

  const resized = await ImageResizer.createResizedImage(
    uri,
    Math.min(width, UPLOAD_MAX_EDGE),
    Math.min(height, UPLOAD_MAX_EDGE),
    'JPEG',
    UPLOAD_JPEG_QUALITY,
    0,
    undefined,
    false,
    {
      mode: 'contain',
      onlyScaleDown: true,
    },
  );

  const fileName = resized.name ? resized.name.replace(/\.(jpe?g|png)$/i, '.jpeg') : undefined;

  return {
    ...(fileName ? { fileName } : {}),
    type: 'image/jpeg',
    uri: resized.uri,
  };
}
