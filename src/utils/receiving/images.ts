import type { ImageSourcePropType } from 'react-native';

import {
  apexLogoImage,
  avatarFallbackImage,
  cardBgImage,
  meBackgroundImage,
  pricingCaptureImage,
} from '@/components/images';

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

export const resolveReceivingImage = (key?: string): ImageSourcePropType => {
  if (!key) return pricingCaptureImage;
  if (isRemoteReceivingImageKey(key)) {
    return { uri: key };
  }
  return IMAGE_MAP[key] ?? pricingCaptureImage;
};

export const resolveReceivingImages = (keys: string[]): ImageSourcePropType[] => {
  if (!keys.length) return [pricingCaptureImage];
  return keys.map((key) => resolveReceivingImage(key));
};
