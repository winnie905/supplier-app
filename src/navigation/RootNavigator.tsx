import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AppTabNavigator } from '@/navigation/AppTabNavigator';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { createStackScreenOptions } from '@/navigation/stackScreenOptions';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const { colors, colorMode, tokens } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) =>
        createStackScreenOptions({
          navigation,
          colors,
          colorMode,
          tokens,
          overrides: {
            headerShown: false,
          },
        })
      }
    >
      {isSignedIn ? (
        <Stack.Screen
          component={AppTabNavigator}
          name={ROUTES.ROOT.APP_TABS}
          options={{
            contentStyle: { backgroundColor: 'transparent' },
            headerShown: false,
          }}
        />
      ) : (
        <Stack.Screen
          component={AuthNavigator}
          name={ROUTES.ROOT.AUTH_STACK}
          options={{
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      )}
    </Stack.Navigator>
  );
};
