/**
 * Android 底部导航栏 / 手势区：隐藏系统栏、按路由设置栏后背景色、计算内容区底部避让。
 */
import type { NavigationState, PartialState } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { NativeModules, Platform } from 'react-native';

import { ROUTES } from '@/constants/routes';

interface NavigationBarNativeModule {
  setColor: (color: string) => void;
  setHidden: (hidden: boolean) => void;
}

const navigationBarNativeModule = (
  NativeModules as { NavigationBarModule?: NavigationBarNativeModule }
).NavigationBarModule;

const setAndroidNavigationBarColor = (color: string) => {
  if (Platform.OS !== 'android') {
    return;
  }

  navigationBarNativeModule?.setColor(color);
};

const setAndroidNavigationBarHidden = (hidden: boolean) => {
  if (Platform.OS !== 'android') {
    return;
  }

  navigationBarNativeModule?.setHidden(hidden);
};

const ANDROID_GESTURE_BOTTOM_INSET_DP = 16;

export const getAndroidGestureBottomInset = (insetsBottom: number): number => {
  if (Platform.OS !== 'android') {
    return insetsBottom;
  }

  return Math.max(insetsBottom, ANDROID_GESTURE_BOTTOM_INSET_DP);
};

export const androidHiddenNavigationBarScreenOptions:
  | Pick<NativeStackNavigationOptions, 'navigationBarHidden' | 'navigationBarTranslucent'>
  | Record<string, never> =
  Platform.OS === 'android'
    ? {
        navigationBarHidden: true,
        navigationBarTranslucent: true,
      }
    : {};

const TRANSPARENT_NAV_BAR_COLOR = '#00000000';
const CAMERA_NAV_BAR_COLOR = '#000000';

interface ThemeColors {
  background: string;
  backgroundElevated: string;
}

const getActiveRouteName = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined => {
  if (!state?.routes?.length) {
    return undefined;
  }

  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];

  if (!route) {
    return undefined;
  }

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
};

const resolveAndroidNavigationBarColor = (
  routeName: string | undefined,
  colors: ThemeColors,
): string => {
  switch (routeName) {
    case ROUTES.LOGISTICS.QR_SCAN:
      return CAMERA_NAV_BAR_COLOR;
    case ROUTES.AUTH.LOGIN:
      return TRANSPARENT_NAV_BAR_COLOR;
    case ROUTES.AUTH.PERSONAL_INFO_COLLECTION_LIST:
    case ROUTES.AUTH.PRIVACY_POLICY:
    case ROUTES.AUTH.SDK_SHARE_LIST:
    case ROUTES.AUTH.USER_SERVICE_AGREEMENT:
      return colors.background;
    case ROUTES.ME.ABOUT:
      return colors.backgroundElevated;
    default:
      return colors.backgroundElevated;
  }
};

export const syncAndroidNavigationBar = (
  state: NavigationState | PartialState<NavigationState> | undefined,
  colors: ThemeColors,
) => {
  if (Platform.OS !== 'android') {
    return;
  }

  const routeName = getActiveRouteName(state);

  setAndroidNavigationBarColor(resolveAndroidNavigationBarColor(routeName, colors));
  setAndroidNavigationBarHidden(true);
};
