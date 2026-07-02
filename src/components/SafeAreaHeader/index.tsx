import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBleedCompensatedTopPadding, getSafeAreaTopInset } from '@/utils/app';

const DEFAULT_HORIZONTAL_PADDING = 16;
const DEFAULT_CONTENT_SPACING = 8;

export interface SafeAreaHeaderProps {
  children: ReactNode;
  /** 安全区下方的内容间距 */
  contentSpacing?: number;
  paddingHorizontal?: number;
  /** 是否绝对定位在父容器顶部 */
  absolute?: boolean;
  /** 父容器 marginTop: -topInset 全屏延伸时补偿，使内容与 Stack Header 对齐 */
  compensateTopBleed?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SafeAreaHeader = ({
  children,
  contentSpacing = DEFAULT_CONTENT_SPACING,
  paddingHorizontal = DEFAULT_HORIZONTAL_PADDING,
  absolute = false,
  compensateTopBleed = false,
  style,
}: SafeAreaHeaderProps) => {
  const insets = useSafeAreaInsets();
  const topPadding = compensateTopBleed
    ? getBleedCompensatedTopPadding(insets.top, contentSpacing)
    : getSafeAreaTopInset(insets.top) + contentSpacing;

  return (
    <View
      style={[
        absolute && styles.absolute,
        {
          paddingTop: topPadding,
          paddingHorizontal,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  absolute: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
