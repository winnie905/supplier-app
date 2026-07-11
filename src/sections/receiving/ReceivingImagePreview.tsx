import { Pressable, Text } from 'design-system-native';
import { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CloseIcon from '@/assets/icons/close.svg';
import { resolveReceivingImages } from '@/utils/receiving/images';

interface ReceivingImagePreviewProps {
  visible: boolean;
  imageKeys: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ReceivingImagePreview = ({
  visible,
  imageKeys,
  initialIndex = 0,
  onClose,
}: ReceivingImagePreviewProps) => {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const images = resolveReceivingImages(imageKeys);
  const [index, setIndex] = useState(initialIndex);

  const currentIndex = Math.min(index, Math.max(images.length - 1, 0));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 12 }]}
        >
          <CloseIcon width={20} height={20} color="#FFFFFF" />
        </Pressable>

        <FlatList
          horizontal
          pagingEnabled
          data={images}
          initialScrollIndex={Math.min(initialIndex, images.length - 1)}
          getItemLayout={(_, i) => ({ length: window.width, offset: window.width * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / window.width);
            setIndex(next);
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: window.width }]}>
              <Image source={item} style={styles.image} resizeMode="contain" />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />

        <Text style={[styles.indicator, { bottom: insets.bottom + 24 }]}>
          {currentIndex + 1}/{images.length}
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    padding: 8,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  indicator: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
  },
});
