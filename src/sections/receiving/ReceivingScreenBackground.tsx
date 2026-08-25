import type { PropsWithChildren } from 'react';
import { Image, ImageBackground, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { receivingBackgroundImage, receivingSecondaryBackgroundImage } from '@/components/images';
import { RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';

/** 收发渐变底色：linear-gradient(180deg, #dae9ff 0%, #f9f9f9 ...) */
export const RECEIVING_GRADIENT_TOP = '#dae9ff';
export const RECEIVING_GRADIENT_BOTTOM = '#f9f9f9';

/** home：首页全屏背景图；secondary：记录类二级页渐变底 + 右上角装饰图 */
export type ReceivingBackgroundVariant = 'home' | 'secondary';

interface ReceivingScreenBackgroundProps {
  variant?: ReceivingBackgroundVariant;
}

/** receiving-bg.png 原始尺寸（按 1179 宽设计稿等比缩放） */
const SECONDARY_BG_WIDTH_RATIO = 645 / 1179;
const SECONDARY_BG_ASPECT = 414 / 645;

const ReceivingGradientBackdrop = ({ bottomOffset }: { bottomOffset: number }) => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
    <Defs>
      <LinearGradient id="receivingScreenBg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={RECEIVING_GRADIENT_TOP} stopOpacity="1" />
        <Stop offset={bottomOffset} stopColor={RECEIVING_GRADIENT_BOTTOM} stopOpacity="1" />
        <Stop offset="1" stopColor={RECEIVING_GRADIENT_BOTTOM} stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width="100%" height="100%" fill="url(#receivingScreenBg)" />
  </Svg>
);

const ReceivingSecondaryBackground = () => {
  const { width } = useWindowDimensions();
  const imageWidth = width * SECONDARY_BG_WIDTH_RATIO;

  return (
    <>
      <ReceivingGradientBackdrop bottomOffset={0.28} />
      <Image
        resizeMode="stretch"
        source={receivingSecondaryBackgroundImage}
        style={[
          styles.secondaryDecor,
          { width: imageWidth, height: imageWidth * SECONDARY_BG_ASPECT },
        ]}
      />
    </>
  );
};

/**
 * 全屏背景：覆盖状态栏与底部手势区，用于收发首页及二级页（扫码页除外）。
 */
export const ReceivingScreenBackground = ({ variant = 'home' }: ReceivingScreenBackgroundProps) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {variant === 'home' ? (
      <>
        <ReceivingGradientBackdrop bottomOffset={0.1} />
        <ImageBackground
          resizeMode="cover"
          source={receivingBackgroundImage}
          style={StyleSheet.absoluteFill}
        />
      </>
    ) : (
      <ReceivingSecondaryBackground />
    )}
  </View>
);

export const ReceivingScreenShell = ({
  variant = 'home',
  children,
}: PropsWithChildren<ReceivingScreenBackgroundProps>) => (
  <View style={styles.shell}>
    <ReceivingScreenBackground variant={variant} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
  },
  secondaryDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
