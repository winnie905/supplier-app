import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions } from '@/navigation/stackScreenOptions';
import type { AppsStackParamList } from '@/navigation/types';
import { AppsHomePage } from '@/pages/apps/AppsHomePage';

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
        options={{ title: '应用' }}
      />
    </Stack.Navigator>
  );
};
