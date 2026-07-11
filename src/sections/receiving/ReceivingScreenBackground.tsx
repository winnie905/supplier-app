import type { PropsWithChildren } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { receivingBackgroundImage } from '@/components/images';
import { RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';

/** 收发模块渐变底色（与 receiving-bg 配套，图片加载前/边缘兜底） */
export const RECEIVING_GRADIENT_TOP = '#dae9ff';

/**
 * 全屏背景：覆盖状态栏与底部手势区，用于收发首页及二级页（扫码页除外）。
 */
export const ReceivingScreenBackground = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, styles.gradientFallback]} />
    <ImageBackground
      resizeMode="cover"
      source={receivingBackgroundImage}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

export const ReceivingScreenShell = ({ children }: PropsWithChildren) => (
  <View style={styles.shell}>
    <ReceivingScreenBackground />
    {children}
  </View>
);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
  },
  gradientFallback: {
    backgroundColor: RECEIVING_GRADIENT_TOP,
  },
});
