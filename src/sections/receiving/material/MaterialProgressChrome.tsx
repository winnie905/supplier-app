import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ReceivingScreenBackground } from '@/sections/receiving/ReceivingScreenBackground';

export const PROGRESS_PANEL_RADIUS = 18;

export const ProgressPanelChrome = ({ width, height }: { width: number; height: number }) => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
    <Defs>
      <LinearGradient id="progressLeadFill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ECF4FF" stopOpacity="1" />
        <Stop offset="1" stopColor="#F8F9F9" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="progressLeadStroke" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={height} fill="url(#progressLeadFill)" />
    <Rect
      x={0.5}
      y={0.5}
      width={Math.max(width - 1, 0)}
      height={Math.max(height - 1, 0)}
      fill="none"
      stroke="url(#progressLeadStroke)"
      strokeWidth={1}
    />
  </Svg>
);

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
      <ReceivingScreenBackground />
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
