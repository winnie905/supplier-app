import { designTokens } from 'design-system-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { ReceivingScreenBackground } from '@/sections/receiving/ReceivingScreenBackground';

export const PROGRESS_PANEL_RADIUS = 18;

export const ProgressPanelChrome = ({ width, height }: { width: number; height: number }) => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
    <Defs>
      <LinearGradient id="progressLeadFill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ECF4FF" stopOpacity="1" />
        <Stop offset="1" stopColor="#F8F9F9" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={height} fill="url(#progressLeadFill)" />
  </Svg>
);

/**
 * 齐套面板 1px 渐变描边：border-image: linear-gradient(180deg, #ffffff 0%, #ffffff00 100%) 1。
 * 顶部两角圆角，底部直角，与面板圆角保持一致。
 */
export const ProgressPanelBorder = ({ width, height }: { width: number; height: number }) => {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const right = width - 0.5;
  const bottom = height - 0.5;
  const radius = Math.min(PROGRESS_PANEL_RADIUS, width / 2, height);
  const outline = [
    `M0.5 ${bottom}`,
    `L0.5 ${0.5 + radius}`,
    `A${radius} ${radius} 0 0 1 ${0.5 + radius} 0.5`,
    `L${right - radius} 0.5`,
    `A${radius} ${radius} 0 0 1 ${right} ${0.5 + radius}`,
    `L${right} ${bottom}`,
    'Z',
  ].join(' ');

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <LinearGradient id="progressPanelBorder" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={outline} fill="none" stroke="url(#progressPanelBorder)" strokeWidth={1} />
    </Svg>
  );
};

/**
 * 裁切并对齐全屏收发背景图：挡住滚动内容，视觉上等同透出页面背景图。
 */
export const AlignedReceivingBackdrop = ({
  topOffset,
  screenHeight,
}: {
  topOffset: number;
  screenHeight: number;
}) => (
  <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdropClip]}>
    <View style={[styles.backdropAlign, { top: -topOffset, height: screenHeight }]}>
      <ReceivingScreenBackground variant="secondary" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  backdropClip: {
    overflow: 'hidden',
  },
  backdropAlign: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
