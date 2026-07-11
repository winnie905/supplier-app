import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  createStackScreenOptions,
  NATIVE_STACK_STATUS_BAR_ON_LIGHT_BG,
  withStackScreenLayout,
} from '@/navigation/stackScreenOptions';
import type { MeStackParamList } from '@/navigation/types';
import { PersonalInfoCollectionListPage } from '@/pages/auth/PersonalInfoCollectionListPage';
import { PrivacyPolicyPage } from '@/pages/auth/PrivacyPolicyPage';
import { SdkShareListPage } from '@/pages/auth/SdkShareListPage';
import { UserServiceAgreementPage } from '@/pages/auth/UserServiceAgreementPage';
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

  const UserServiceAgreementScreen = useMemo(
    () => withStackScreenLayout(UserServiceAgreementPage, { backgroundColor: colors.background }),
    [colors.background],
  );

  const PrivacyPolicyScreen = useMemo(
    () => withStackScreenLayout(PrivacyPolicyPage, { backgroundColor: colors.background }),
    [colors.background],
  );

  const PersonalInfoCollectionListScreen = useMemo(
    () =>
      withStackScreenLayout(PersonalInfoCollectionListPage, { backgroundColor: colors.background }),
    [colors.background],
  );

  const SdkShareListScreen = useMemo(
    () => withStackScreenLayout(SdkShareListPage, { backgroundColor: colors.background }),
    [colors.background],
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
          title: '我的',
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
          title: '关于',
          contentStyle: { backgroundColor: colors.backgroundElevated },
          headerStyle: {
            backgroundColor: colors.backgroundElevated,
          },
        }}
      />
      <Stack.Screen
        component={UserServiceAgreementScreen}
        name={ROUTES.ME.USER_SERVICE_AGREEMENT}
        options={{
          title: '供应商协同平台用户协议',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen
        component={PrivacyPolicyScreen}
        name={ROUTES.ME.PRIVACY_POLICY}
        options={{
          title: '隐私政策',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen
        component={PersonalInfoCollectionListScreen}
        name={ROUTES.ME.PERSONAL_INFO_COLLECTION_LIST}
        options={{
          title: '个人信息收集清单',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen
        component={SdkShareListScreen}
        name={ROUTES.ME.SDK_SHARE_LIST}
        options={{
          title: '第三方共享个人信息（含 SDK）清单',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack.Navigator>
  );
};
