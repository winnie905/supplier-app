import { designTokens, ImagePreview } from 'design-system-native';
import { useMemo } from 'react';

import CloseIcon from '@/assets/icons/close.svg';
import { resolveReceivingImages } from '@/utils/receiving/images';

interface ReceivingImagePreviewProps {
  visible: boolean;
  imageKeys: string[];
  initialIndex?: number;
  onClose: () => void;
}

/** 收发域适配：解析图片 key 后交给 DSN ImagePreview */
export const ReceivingImagePreview = ({
  visible,
  imageKeys,
  initialIndex = 0,
  onClose,
}: ReceivingImagePreviewProps) => {
  const images = useMemo(() => resolveReceivingImages(imageKeys), [imageKeys]);

  return (
    <ImagePreview
      visible={visible}
      images={images}
      initialIndex={initialIndex}
      onClose={onClose}
      renderCloseIcon={() => (
        <CloseIcon width={20} height={20} color={designTokens.colors.gray[0]} />
      )}
    />
  );
};
