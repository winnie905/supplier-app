import {
  type BottomTabBarButtonProps,
  type BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { getFocusedRouteNameFromRoute, type RouteProp } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MeTabIcon from '@/assets/icons/icon_me.svg';
import WorkspaceTabIcon from '@/assets/icons/icon_workspace.svg';
import ScanTabIcon from '@/assets/icons/scan.svg';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';
import { AppsNavigator } from '@/navigation/AppsNavigator';
import { LogisticsNavigator } from '@/navigation/LogisticsNavigator';
import { MeNavigator } from '@/navigation/MeNavigator';
import { MessagesNavigator } from '@/navigation/MessagesNavigator';
import { ReportsNavigator } from '@/navigation/ReportsNavigator';
import type { AppTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<AppTabParamList>();

type TabRouteName = keyof AppTabParamList;
type TabRoute = RouteProp<AppTabParamList, TabRouteName>;

const renderTabBarButton = (props: BottomTabBarButtonProps) => (
  <PlatformPressable
    {...props}
    android_ripple={{
      color: 'transparent',
      borderless: false,
    }}
  />
);

const TAB_BAR_PADDING_BOTTOM = 8;
const TAB_BAR_HOME_BASE_HEIGHT = 56;

const HOME_ROUTES: Partial<Record<TabRouteName, string>> = {
  [ROUTES.TABS.APPS_TAB]: ROUTES.APPS.APPS_HOME,
  [ROUTES.TABS.REPORTS_TAB]: ROUTES.REPORTS.REPORTS_HOME,
  [ROUTES.TABS.LOGISTICS_TAB]: ROUTES.LOGISTICS.LOGISTICS_HOME,
  [ROUTES.TABS.MESSAGES_TAB]: ROUTES.MESSAGES.MESSAGES_HOME,
  [ROUTES.TABS.ME_TAB]: ROUTES.ME.ME_HOME,
};

export const AppTabNavigator = () => {
  const { colors, tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const tabOptions = useMemo(() => {
    const androidGestureBottomInset = getAndroidGestureBottomInset(insets.bottom);

    const tabBarStyle: BottomTabNavigationOptions['tabBarStyle'] = {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.backgroundElevated,
      borderTopWidth: 0,
      borderTopColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
      elevation: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    };

    const homeTabBarStyle: BottomTabNavigationOptions['tabBarStyle'] =
      Platform.OS === 'android'
        ? {
            ...tabBarStyle,
            height: TAB_BAR_HOME_BASE_HEIGHT + androidGestureBottomInset,
            paddingBottom: TAB_BAR_PADDING_BOTTOM + androidGestureBottomInset,
          }
        : tabBarStyle;

    const hiddenTabBarStyle: BottomTabNavigationOptions['tabBarStyle'] = {
      ...tabBarStyle,
      display: 'none',
    };

    const screenOptions: BottomTabNavigationOptions = {
      headerShown: false,
      tabBarBackground: () => (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundElevated }]} />
      ),
      tabBarButton: renderTabBarButton,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarActiveBackgroundColor: 'transparent',
      tabBarInactiveBackgroundColor: 'transparent',
      tabBarItemStyle: {
        backgroundColor: 'transparent',
      },
      tabBarLabelStyle: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        marginBottom: 0,
      },
      tabBarStyle,
    };

    const getTabOptions =
      (tabName: TabRouteName, label: string, Icon: React.ComponentType<{ color: string }>) =>
      ({ route }: { route: TabRoute }): BottomTabNavigationOptions => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? HOME_ROUTES[tabName];
        const shouldShowTabBar = focusedRouteName === HOME_ROUTES[tabName];

        return {
          popToTopOnBlur: tabName === ROUTES.TABS.ME_TAB,
          tabBarIcon: ({ color }) => <Icon color={color} />,
          tabBarLabel: label,
          tabBarStyle: shouldShowTabBar ? homeTabBarStyle : hiddenTabBarStyle,
        };
      };

    return {
      screenOptions,
      appsOptions: getTabOptions(ROUTES.TABS.APPS_TAB, '应用', WorkspaceTabIcon),
      reportsOptions: getTabOptions(ROUTES.TABS.REPORTS_TAB, '报表', WorkspaceTabIcon),
      logisticsOptions: getTabOptions(ROUTES.TABS.LOGISTICS_TAB, '收发', ScanTabIcon),
      messagesOptions: getTabOptions(ROUTES.TABS.MESSAGES_TAB, '消息', WorkspaceTabIcon),
      meOptions: getTabOptions(ROUTES.TABS.ME_TAB, '我的', MeTabIcon),
    };
  }, [
    colors.backgroundElevated,
    colors.primary,
    colors.textMuted,
    insets.bottom,
    tokens.typography.fontSize.xs,
    tokens.typography.fontWeight.medium,
  ]);

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.TABS.LOGISTICS_TAB}
      screenOptions={tabOptions.screenOptions}
    >
      <Tab.Screen
        component={AppsNavigator}
        name={ROUTES.TABS.APPS_TAB}
        options={tabOptions.appsOptions}
      />
      <Tab.Screen
        component={ReportsNavigator}
        name={ROUTES.TABS.REPORTS_TAB}
        options={tabOptions.reportsOptions}
      />
      <Tab.Screen
        component={LogisticsNavigator}
        name={ROUTES.TABS.LOGISTICS_TAB}
        options={tabOptions.logisticsOptions}
      />
      <Tab.Screen
        component={MessagesNavigator}
        name={ROUTES.TABS.MESSAGES_TAB}
        options={tabOptions.messagesOptions}
      />
      <Tab.Screen
        component={MeNavigator}
        name={ROUTES.TABS.ME_TAB}
        options={tabOptions.meOptions}
      />
    </Tab.Navigator>
  );
};
