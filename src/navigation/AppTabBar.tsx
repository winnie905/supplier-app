import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { designTokens } from 'design-system-native';
import { useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ApplicationIcon from '@/assets/icons/tab/application.svg';
import ManagementIcon from '@/assets/icons/tab/management.svg';
import MeIcon from '@/assets/icons/tab/me.svg';
import MessageIcon from '@/assets/icons/tab/message.svg';
import ReportIcon from '@/assets/icons/tab/report.svg';
import {
  tabApplicationActiveImage,
  tabManagementActiveImage,
  tabMeActiveImage,
  tabMessageActiveImage,
  tabReportActiveImage,
} from '@/components/images';
import { ROUTES } from '@/constants/routes';

const SLIDER_VERTICAL_MARGIN = 4;
const SLIDER_HEIGHT = 48;
const CONTAINER_HEIGHT = SLIDER_HEIGHT + SLIDER_VERTICAL_MARGIN * 2;
const CONTAINER_RADIUS = 97;
const CONTAINER_BORDER_WIDTH = 1;
const SLIDER_RADIUS = 58;
const CONTAINER_PADDING = 4;
const HORIZONTAL_MARGIN = 16;
const MIN_BOTTOM_MARGIN = 16;
const SLIDE_DURATION_MS = 260;
const TAB_ICON_SIZE = 24;

const CONTAINER_COLOR = '#F3F8FC';
const CONTAINER_BORDER_COLOR = designTokens.colors.gray[0];
const SLIDER_COLOR = '#DFE8F4';
const ACTIVE_TEXT_COLOR = designTokens.colors.brand[500];
const INACTIVE_TEXT_COLOR = '#6C829E';

type TabIcon = React.ComponentType<{ width?: number; height?: number }>;

interface TabMeta {
  label: string;
  Icon: TabIcon;
  activeIcon: ImageSourcePropType;
  home: string;
}

const TAB_META: Record<string, TabMeta> = {
  [ROUTES.TABS.APPS_TAB]: {
    label: '应用',
    Icon: ApplicationIcon,
    activeIcon: tabApplicationActiveImage,
    home: ROUTES.APPS.APPS_HOME,
  },
  [ROUTES.TABS.REPORTS_TAB]: {
    label: '报表',
    Icon: ReportIcon,
    activeIcon: tabReportActiveImage,
    home: ROUTES.REPORTS.REPORTS_HOME,
  },
  [ROUTES.TABS.LOGISTICS_TAB]: {
    label: '收发',
    Icon: ManagementIcon,
    activeIcon: tabManagementActiveImage,
    home: ROUTES.LOGISTICS.LOGISTICS_HOME,
  },
  [ROUTES.TABS.MESSAGES_TAB]: {
    label: '消息',
    Icon: MessageIcon,
    activeIcon: tabMessageActiveImage,
    home: ROUTES.MESSAGES.MESSAGES_HOME,
  },
  [ROUTES.TABS.ME_TAB]: {
    label: '我的',
    Icon: MeIcon,
    activeIcon: tabMeActiveImage,
    home: ROUTES.ME.ME_HOME,
  },
};

export const AppTabBar = ({ state, navigation, descriptors }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);
  const hasInitialized = useRef(false);

  const tabCount = state.routes.length;
  // 内容区宽度 = 边框盒宽度 - 左右边框，items 均分该宽度
  const innerWidth =
    containerWidth > 0 ? containerWidth - CONTAINER_BORDER_WIDTH * 2 - CONTAINER_PADDING * 2 : 0;
  const itemWidth = tabCount > 0 ? innerWidth / tabCount : 0;

  useEffect(() => {
    if (itemWidth <= 0) {
      return;
    }

    const target = state.index * itemWidth;

    // 首次布局直接就位，避免从最左侧滑入的初始动画
    if (!hasInitialized.current) {
      translateX.value = target;
      hasInitialized.current = true;
      return;
    }

    translateX.value = withTiming(target, { duration: SLIDE_DURATION_MS });
  }, [state.index, itemWidth, translateX]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // 嵌套子页 / 显式 tabBarStyle.display=none 时隐藏 TabBar。
  // 注意：不要 return null 卸载 —— 否则 useBottomTabBarHeight() 会变成 0，
  // 收发首页跟着整页重算布局，把子页首屏 commit 堵死 8s+（见 NavPerf 日志）。
  const focusedTabRoute = state.routes[state.index];
  const focusedMeta = focusedTabRoute ? TAB_META[focusedTabRoute.name] : undefined;

  let hideTabBar = false;
  if (focusedTabRoute) {
    const tabBarStyle = descriptors[focusedTabRoute.key]?.options.tabBarStyle;
    if (
      tabBarStyle &&
      typeof tabBarStyle === 'object' &&
      !Array.isArray(tabBarStyle) &&
      'display' in tabBarStyle &&
      tabBarStyle.display === 'none'
    ) {
      hideTabBar = true;
    }
  }
  if (!hideTabBar && focusedTabRoute && focusedMeta) {
    const focusedChildRoute = getFocusedRouteNameFromRoute(focusedTabRoute) ?? focusedMeta.home;
    if (focusedChildRoute !== focusedMeta.home) {
      hideTabBar = true;
    }
  }

  return (
    <View
      pointerEvents={hideTabBar ? 'none' : 'box-none'}
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, MIN_BOTTOM_MARGIN) },
        hideTabBar && styles.wrapperHidden,
      ]}
    >
      <View
        style={styles.container}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.slider, { width: itemWidth }, sliderStyle]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];

          if (!meta) {
            return null;
          }

          const isFocused = state.index === index;
          const IconComponent = meta.Icon;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const handleLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={styles.item}
            >
              {isFocused ? (
                <Image source={meta.activeIcon} style={styles.activeIcon} resizeMode="contain" />
              ) : (
                <IconComponent width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />
              )}
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? ACTIVE_TEXT_COLOR : INACTIVE_TEXT_COLOR },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
  },
  wrapperHidden: {
    opacity: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CONTAINER_HEIGHT,
    borderRadius: CONTAINER_RADIUS,
    borderWidth: CONTAINER_BORDER_WIDTH,
    borderColor: CONTAINER_BORDER_COLOR,
    backgroundColor: CONTAINER_COLOR,
    paddingHorizontal: CONTAINER_PADDING,
  },
  slider: {
    position: 'absolute',
    left: CONTAINER_PADDING,
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_RADIUS,
    backgroundColor: SLIDER_COLOR,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeIcon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
