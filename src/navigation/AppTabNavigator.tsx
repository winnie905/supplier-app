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
import { MessagesNavigator } from '@/navigation/MessagesNavigator';
import { ReportsNavigator } from '@/navigation/ReportsNavigator';
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
      <Tab.Screen component={ReportsNavigator} name={ROUTES.TABS.REPORTS_TAB} />
      <Tab.Screen component={LogisticsNavigator} name={ROUTES.TABS.LOGISTICS_TAB} />
      <Tab.Screen component={MessagesNavigator} name={ROUTES.TABS.MESSAGES_TAB} />
      <Tab.Screen
        component={MeNavigator}
        name={ROUTES.TABS.ME_TAB}
        options={{ popToTopOnBlur: true }}
      />
    </Tab.Navigator>
  );
};
