import { memo } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import { goIconImage } from '@/components/images';
import type { FrameDimensions } from '@/utils/qrScan';

const MARKER_SIZE = 36;

export const QrCodeMarker = memo(
  ({ x, y, width, height, onPress }: FrameDimensions & { onPress: () => void }) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    return (
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={[
          styles.markerContainer,
          {
            left: centerX - MARKER_SIZE / 2,
            top: centerY - MARKER_SIZE / 2,
          },
        ]}
      >
        <Image source={goIconImage} style={styles.icon} />
      </Pressable>
    );
  },
);

QrCodeMarker.displayName = 'QrCodeMarker';

const styles = StyleSheet.create({
  markerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  icon: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
});
