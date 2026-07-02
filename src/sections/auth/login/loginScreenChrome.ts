import { Dimensions, Platform } from 'react-native';

/** 登录背景铺满物理屏幕所需的尺寸（相对页面根节点）。 */
export const getLoginBackgroundLayout = (insets: { top: number; bottom: number }) => {
  const screen = Dimensions.get('screen');

  if (Platform.OS !== 'android') {
    return {
      height: screen.height + insets.top,
      marginBottom: 0,
      top: -insets.top,
      width: screen.width,
    };
  }

  return {
    height: screen.height + insets.top,
    marginBottom: -insets.bottom,
    top: -insets.top,
    width: screen.width,
  };
};
