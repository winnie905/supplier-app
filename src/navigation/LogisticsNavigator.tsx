import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions, withStackScreenLayout } from '@/navigation/stackScreenOptions';
import type { LogisticsStackParamList } from '@/navigation/types';
import { QrScanScreenPage } from '@/pages/common/QrScanScreenPage';
import { LogisticsHomePage } from '@/pages/logistics/LogisticsHomePage';

const Stack = createNativeStackNavigator<LogisticsStackParamList>();

export const LogisticsNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

  const LogisticsHomeScreen = useMemo(
    () => withStackScreenLayout(LogisticsHomePage, { backgroundColor: colors.background }),
    [colors.background],
  );

  const QrScanScreen = useMemo(
    () => withStackScreenLayout(QrScanScreenPage, { backgroundColor: '#000000' }),
    [],
  );

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
        component={LogisticsHomeScreen}
        name={ROUTES.LOGISTICS.LOGISTICS_HOME}
        options={{ title: '收发' }}
      />
      <Stack.Screen
        component={QrScanScreen}
        name={ROUTES.LOGISTICS.QR_SCAN}
        options={{
          headerShown: false,
          statusBarStyle: 'light',
        }}
      />
    </Stack.Navigator>
  );
};
