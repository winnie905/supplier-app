import { designTokens, ImageGallery, Text } from 'design-system-native';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { managementEmptyImage } from '@/components/images';
import { useImageSourceAspectRatio } from '@/hooks/receiving/useImageSourceAspectRatio';
import { PANEL_IMAGE_OVERLAP } from '@/sections/receiving/home/panelLayout';

/** 宽铺满屏、按原比例从上往下排，不 cover 居中裁切 */
const HeroSlideImage = ({ source, width }: { source: ImageSourcePropType; width: number }) => {
  const aspect = useImageSourceAspectRatio(source);
  return <Image resizeMode="stretch" source={source} style={{ width, height: width / aspect }} />;
};

interface ReceivingHomeHeroProps {
  hasSampleImage: boolean;
  heroImages: ImageSourcePropType[];
  windowWidth: number;
  contentTopInset: number;
  productCode: string;
  color: string;
  brand: string;
  safeHeroIndex: number;
  onHeroIndexChange: (index: number) => void;
  onPressImage: () => void;
}

export const ReceivingHomeHero = ({
  hasSampleImage,
  heroImages,
  windowWidth,
  contentTopInset,
  productCode,
  color,
  brand,
  safeHeroIndex,
  onHeroIndexChange,
  onPressImage,
}: ReceivingHomeHeroProps) => {
  if (!hasSampleImage || heroImages.length === 0) {
    return (
      <View style={styles.placeholderArea}>
        <Image resizeMode="contain" source={managementEmptyImage} style={styles.placeholderImage} />
      </View>
    );
  }

  return (
    <ImageGallery
      images={heroImages}
      itemWidth={windowWidth}
      index={safeHeroIndex}
      onIndexChange={onHeroIndexChange}
      showPageIndicator
      itemContainerStyle={[styles.slide, { paddingTop: contentTopInset }]}
      renderItem={({ item, width }) => <HeroSlideImage source={item} width={width} />}
      onPressImage={() => onPressImage()}
      pageIndicatorStyle={styles.pageIndicator}
      renderOverlay={() => (
        <View style={styles.heroOverlay} pointerEvents="none">
          <Text style={styles.heroTitle}>
            {productCode} | {color}
          </Text>
          <View style={styles.brandRow}>
            <View style={styles.brandLabel}>
              <Text style={styles.brandTagText}>品牌</Text>
            </View>
            <View style={styles.brandName}>
              <Text style={styles.brandTagText}>{brand}</Text>
            </View>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  placeholderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  placeholderImage: {
    width: 170,
    height: 170,
  },
  slide: {
    height: '100%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    left: 12,
    bottom: PANEL_IMAGE_OVERLAP + 17,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
  },
  heroTitle: {
    color: designTokens.colors.gray[0],
    fontSize: 16,
    fontWeight: '700',
  },
  brandRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    overflow: 'hidden',
    borderRadius: 4,
  },
  brandLabel: {
    padding: 4,
    backgroundColor: '#659CE5',
  },
  brandName: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandTagText: {
    color: designTokens.colors.gray[0],
    fontSize: 12,
    fontWeight: '600',
  },
  pageIndicator: {
    bottom: PANEL_IMAGE_OVERLAP + 17,
  },
});
