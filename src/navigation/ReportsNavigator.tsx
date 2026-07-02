import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions } from '@/navigation/stackScreenOptions';
import type { ReportsStackParamList } from '@/navigation/types';
import { ReportsHomePage } from '@/pages/reports/ReportsHomePage';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export const ReportsNavigator = () => {
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
        component={ReportsHomePage}
        name={ROUTES.REPORTS.REPORTS_HOME}
        options={{ title: '报表' }}
      />
    </Stack.Navigator>
  );
};
