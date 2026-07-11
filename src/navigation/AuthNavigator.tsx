import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions, withStackScreenLayout } from '@/navigation/stackScreenOptions';
import type { AuthStackParamList } from '@/navigation/types';
import { LoginPage } from '@/pages/auth/LoginPage';
import { PersonalInfoCollectionListPage } from '@/pages/auth/PersonalInfoCollectionListPage';
import { PrivacyPolicyPage } from '@/pages/auth/PrivacyPolicyPage';
import { SdkShareListPage } from '@/pages/auth/SdkShareListPage';
import { UserServiceAgreementPage } from '@/pages/auth/UserServiceAgreementPage';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

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
          overrides: {
            headerShown: false,
            headerBackTitle: '',
            headerTransparent: false,
          },
        })
      }
    >
      <Stack.Screen
        component={LoginPage}
        name={ROUTES.AUTH.LOGIN}
        options={{
          contentStyle: { backgroundColor: 'transparent' },
          statusBarStyle: 'dark',
          statusBarTranslucent: true,
        }}
      />

      <Stack.Screen
        component={UserServiceAgreementScreen}
        name={ROUTES.AUTH.USER_SERVICE_AGREEMENT}
        options={{
          headerShown: true,
          title: '供应商协同平台用户协议',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Stack.Screen
        component={PrivacyPolicyScreen}
        name={ROUTES.AUTH.PRIVACY_POLICY}
        options={{
          headerShown: true,
          title: '隐私政策',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Stack.Screen
        component={PersonalInfoCollectionListScreen}
        name={ROUTES.AUTH.PERSONAL_INFO_COLLECTION_LIST}
        options={{
          headerShown: true,
          title: '个人信息收集清单',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Stack.Screen
        component={SdkShareListScreen}
        name={ROUTES.AUTH.SDK_SHARE_LIST}
        options={{
          headerShown: true,
          title: '第三方共享个人信息（含 SDK）清单',
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack.Navigator>
  );
};
