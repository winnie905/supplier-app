import { designTokens, Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';

export type CornerCheckPosition = 'top-right' | 'bottom-right';

interface CornerCheckOptionProps {
  label: ReactNode;
  selected: boolean;
  onPress: () => void;
  /** Selected corner badge position. Defaults to top-right. */
  cornerPosition?: CornerCheckPosition;
  style?: StyleProp<ViewStyle>;
}

export const CornerCheckOption = ({
  label,
  selected,
  onPress,
  cornerPosition = 'top-right',
  style,
}: CornerCheckOptionProps) => {
  const isBottom = cornerPosition === 'bottom-right';

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        style={[styles.item, selected && styles.itemSelected]}
      >
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      </Pressable>
      {selected ? (
        <View
          pointerEvents="none"
          style={[styles.corner, isBottom ? styles.cornerBottomRight : styles.cornerTopRight]}
        >
          <View
            style={[
              styles.triangle,
              isBottom ? styles.triangleBottomRight : styles.triangleTopRight,
            ]}
          />
          <View style={[styles.check, isBottom ? styles.checkBottomRight : styles.checkTopRight]}>
            <CheckIcon color={designTokens.colors.gray[0]} height={8} width={8} />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const BORDER_WIDTH = 1;
const RADIUS = 8;
const CORNER_SIZE = 25;

const styles = StyleSheet.create({
  item: {
    height: 38,
    borderRadius: RADIUS,
    paddingVertical: 8,
    backgroundColor: '#F7F9FA',
    borderWidth: BORDER_WIDTH,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: {
    backgroundColor: '#EEF5FF',
    borderColor: '#0958D9',
  },
  label: {
    fontSize: 16,
    color: '#021626',
  },
  labelSelected: {
    color: '#0958D9',
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    overflow: 'hidden',
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopRightRadius: RADIUS,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomRightRadius: RADIUS,
  },
  triangle: {
    position: 'absolute',
    right: -1,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: CORNER_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleTopRight: {
    top: -1,
    borderTopWidth: CORNER_SIZE,
    borderTopColor: '#0958D9',
    borderBottomColor: 'transparent',
  },
  triangleBottomRight: {
    bottom: 0,
    borderBottomWidth: CORNER_SIZE,
    borderBottomColor: '#0958D9',
    borderTopColor: 'transparent',
  },
  check: {
    position: 'absolute',
    right: 3,
  },
  checkTopRight: {
    top: 3,
  },
  checkBottomRight: {
    bottom: 3,
  },
});
