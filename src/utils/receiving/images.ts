import type { ImageSourcePropType } from 'react-native';

import {
  apexLogoImage,
  avatarFallbackImage,
  cardBgImage,
  meBackgroundImage,
  pricingCaptureImage,
} from '@/components/images';
import { buildFileUrl } from '@/utils/app';

const IMAGE_MAP: Record<string, ImageSourcePropType> = {
  'pricing-capture': pricingCaptureImage,
  'card-bg': cardBgImage,
  'me-bg': meBackgroundImage,
  avatar: avatarFallbackImage,
  apex: apexLogoImage,
};

export const REMOTE_RECEIVING_IMAGE_ASPECT = 800 / 1200;

export const isRemoteReceivingImageKey = (key?: string): boolean =>
  Boolean(key && /^https?:\/\//i.test(key));

/**
 * 解析收发/订单样品图：
 * - 空：占位本地图（首页无样品图另用 managementEmpty）
 * - http(s)：直接用
 * - 本地 key（pricing-capture 等）：本地资源
 * - 其它相对路径（designImageUrls）：拼 assetHost（getAssetHost 写入）
 */
export const resolveReceivingImage = (key?: string): ImageSourcePropType => {
  if (!key) return pricingCaptureImage;
  if (isRemoteReceivingImageKey(key)) {
    return { uri: key };
  }
  const local = IMAGE_MAP[key];
  if (local) return local;
  const url = buildFileUrl(key, { original: true });
  return url ? { uri: url } : pricingCaptureImage;
};

export const resolveReceivingImages = (keys: string[]): ImageSourcePropType[] => {
  if (!keys.length) return [pricingCaptureImage];
  return keys.map((key) => resolveReceivingImage(key));
};
