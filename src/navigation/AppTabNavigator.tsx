import {
  type BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

import { ROUTES } from '@/constants/routes';
import { AppsNavigator } from '@/navigation/AppsNavigator';
import { AppTabBar } from '@/navigation/AppTabBar';
import { LogisticsNavigator } from '@/navigation/LogisticsNavigator';
import { MeNavigator } from '@/navigation/MeNavigator';
import type { AppTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTabNavigator = () => {
  const screenOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      headerShown: false,
    }),
    [],
  );

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.TABS.LOGISTICS_TAB}
      screenOptions={screenOptions}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tab.Screen component={AppsNavigator} name={ROUTES.TABS.APPS_TAB} />
      {/* 报表 / 消息暂隐藏 */}
      <Tab.Screen component={LogisticsNavigator} name={ROUTES.TABS.LOGISTICS_TAB} />
      <Tab.Screen
        component={MeNavigator}
        name={ROUTES.TABS.ME_TAB}
        options={{ popToTopOnBlur: true }}
      />
    </Tab.Navigator>
  );
};
