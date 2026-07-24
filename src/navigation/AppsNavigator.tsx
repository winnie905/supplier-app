import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions } from '@/navigation/stackScreenOptions';
import type { AppsStackParamList } from '@/navigation/types';
import { AppsHomePage } from '@/pages/apps/AppsHomePage';
import { AppsSearchPage } from '@/pages/apps/AppsSearchPage';
import { ProductionOrdersPage } from '@/pages/apps/ProductionOrdersPage';

const Stack = createNativeStackNavigator<AppsStackParamList>();

export const AppsNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) =>
        createStackScreenOptions({
          navigation,
          colors,
          colorMode,
          tokens,
        })
      }
    >
      <Stack.Screen
        component={AppsHomePage}
        name={ROUTES.APPS.APPS_HOME}
        options={{
          headerShown: false,
          title: '应用',
          statusBarStyle: 'light',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        component={ProductionOrdersPage}
        name={ROUTES.APPS.PRODUCTION_ORDERS}
        options={{
          headerShown: false,
          title: '订单查询',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        component={AppsSearchPage}
        name={ROUTES.APPS.APPS_SEARCH}
        options={{ headerShown: false, title: '搜索' }}
      />
    </Stack.Navigator>
  );
};
