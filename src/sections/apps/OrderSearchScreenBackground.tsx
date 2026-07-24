import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { orderSearchBackgroundImage } from '@/components/images';

/** orderSearchBg.png 原始尺寸 */
const ORDER_SEARCH_BG_ASPECT = 1083 / 1179;

/**
 * 订单查询页背景：全屏渐变底 + 顶部自然高度的背景图（宽度铺满，不拉伸铺满整页）。
 */
export const OrderSearchScreenBackground = () => {
  const { width } = useWindowDimensions();
  const imageHeight = width * ORDER_SEARCH_BG_ASPECT;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          {/* linear-gradient(129deg, #ddefff 0%, #eff8ff 96%) */}
          <LinearGradient id="orderSearchPageGrad" x1="0" y1="0" x2="0.777" y2="0.629">
            <Stop offset="0" stopColor="#DDEFFF" />
            <Stop offset="0.96" stopColor="#EFF8FF" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#orderSearchPageGrad)" height="100%" width="100%" x="0" y="0" />
      </Svg>
      <Image
        resizeMode="stretch"
        source={orderSearchBackgroundImage}
        style={{ width, height: imageHeight }}
      />
    </View>
  );
};
