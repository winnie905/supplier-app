import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { ABOUT_STRINGS, ME_STRINGS } from '@/constants/legalContent';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  createStackScreenOptions,
  NATIVE_STACK_STATUS_BAR_ON_LIGHT_BG,
  withStackScreenLayout,
} from '@/navigation/stackScreenOptions';
import type { MeStackParamList } from '@/navigation/types';
import { AboutPage } from '@/pages/me/AboutPage';
import { MePage } from '@/pages/me/MePage';

const Stack = createNativeStackNavigator<MeStackParamList>();

export const MeNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

  const MeHomeScreen = useMemo(
    () => withStackScreenLayout(MePage, { backgroundColor: 'transparent' }),
    [],
  );

  const AboutScreen = useMemo(
    () => withStackScreenLayout(AboutPage, { backgroundColor: colors.backgroundElevated }),
    [colors.backgroundElevated],
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
        component={MeHomeScreen}
        name={ROUTES.ME.ME_HOME}
        options={{
          title: ME_STRINGS.title,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          statusBarStyle: NATIVE_STACK_STATUS_BAR_ON_LIGHT_BG,
        }}
      />
      <Stack.Screen
        component={AboutScreen}
        name={ROUTES.ME.ABOUT}
        options={{
          title: ABOUT_STRINGS.title,
          contentStyle: { backgroundColor: colors.backgroundElevated },
          headerStyle: {
            backgroundColor: colors.backgroundElevated,
          },
        }}
      />
    </Stack.Navigator>
  );
};
