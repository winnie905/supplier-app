import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { managementEmptyImage } from '@/components/images';
import { useImageSourceAspectRatio } from '@/hooks/receiving/useImageSourceAspectRatio';
import { resolveReceivingImage } from '@/utils/receiving/images';

const DEFAULT_WIDTH = 72;
const DEFAULT_HEIGHT = 96;

interface OrderInfoThumbnailProps {
  /** 图片 key / url；空则显示 managementEmpty，无背景色 */
  imageKey: string | undefined;
  width?: number;
  height?: number;
  /** cover：铺满裁切；contain：按原比例完整显示 */
  fit?: 'cover' | 'contain';
  style?: StyleProp<ViewStyle>;
}

/**
 * 生产单信息卡片统一缩略图：
 * - 有图：cover + 顶对齐（从上往下显示，多出裁底部），或 contain 原比例
 * - 无图：managementEmpty，透明底
 */
export const OrderInfoThumbnail = ({
  imageKey,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  fit = 'cover',
  style,
}: OrderInfoThumbnailProps) => {
  const hasImage = Boolean(imageKey?.trim());
  const source = hasImage ? resolveReceivingImage(imageKey) : undefined;
  const imageAspect = useImageSourceAspectRatio(source);

  if (!hasImage || !source) {
    return (
      <View style={[{ width, height, borderRadius: 4 }, style]}>
        <Image
          source={managementEmptyImage}
          resizeMode="contain"
          style={{ width, height, borderRadius: 4 }}
        />
      </View>
    );
  }

  if (fit === 'contain') {
    return (
      <View style={[styles.clip, { width, height }, style]}>
        <Image source={source} resizeMode="contain" style={{ width, height }} />
      </View>
    );
  }

  const widthFillHeight = width / imageAspect;
  const heightFillWidth = height * imageAspect;
  const coverByWidth = widthFillHeight >= height;
  const displayWidth = coverByWidth ? width : heightFillWidth;
  const displayHeight = coverByWidth ? widthFillHeight : height;
  const displayLeft = (width - displayWidth) / 2;

  return (
    <View style={[styles.clip, { width, height }, style]}>
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          top: 0,
          left: displayLeft,
          width: displayWidth,
          height: displayHeight,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    borderRadius: 4,
    overflow: 'hidden',
  },
});
