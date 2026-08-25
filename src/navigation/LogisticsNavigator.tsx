import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { designTokens } from 'design-system-native';
import { useMemo } from 'react';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions, withStackScreenLayout } from '@/navigation/stackScreenOptions';
import type { LogisticsStackParamList } from '@/navigation/types';
import { QrScanScreenPage } from '@/pages/common/QrScanScreenPage';
import { LogisticsHomePage } from '@/pages/logistics/LogisticsHomePage';
import { CuttingRecordsPage } from '@/pages/receiving/CuttingRecordsPage';
import { ExceptionReplyListPage } from '@/pages/receiving/ExceptionReplyListPage';
import { MaterialConfirmationPage } from '@/pages/receiving/MaterialConfirmationPage';
import { PackingRecordsPage } from '@/pages/receiving/PackingRecordsPage';
import { ReceivingSearchPage } from '@/pages/receiving/ReceivingSearchPage';
import { SewingRecordsPage } from '@/pages/receiving/SewingRecordsPage';
import { withReceivingStackScreenLayout } from '@/sections/receiving/withReceivingStackScreenLayout';

const Stack = createNativeStackNavigator<LogisticsStackParamList>();

export const LogisticsNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

  const screens = useMemo(
    () => ({
      LogisticsHome: withStackScreenLayout(LogisticsHomePage, { backgroundColor: 'transparent' }),
      QrScan: withStackScreenLayout(QrScanScreenPage, { backgroundColor: '#000000' }),
      ReceivingSearch: withStackScreenLayout(ReceivingSearchPage, {
        backgroundColor: designTokens.colors.gray[0],
      }),
      MaterialConfirmation: withReceivingStackScreenLayout(MaterialConfirmationPage, {
        variant: 'secondary',
      }),
      ExceptionReplyList: withReceivingStackScreenLayout(ExceptionReplyListPage),
      CuttingRecords: withReceivingStackScreenLayout(CuttingRecordsPage, { variant: 'secondary' }),
      SewingRecords: withReceivingStackScreenLayout(SewingRecordsPage, { variant: 'secondary' }),
      PackingRecords: withReceivingStackScreenLayout(PackingRecordsPage, { variant: 'secondary' }),
    }),
    [],
  );

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        ...createStackScreenOptions({
          navigation,
          colors,
          colorMode,
          tokens,
        }),
        animation: 'none',
        // freezeOnBlur 冻结重型首页树本身可能很慢（NavPerf 显示 first-render→effect 卡 8s+），先关闭验证
        freezeOnBlur: false,
      })}
    >
      <Stack.Screen
        component={screens.LogisticsHome}
        name={ROUTES.LOGISTICS.LOGISTICS_HOME}
        options={{
          headerShown: false,
          statusBarTranslucent: true,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      />
      <Stack.Screen
        component={screens.QrScan}
        name={ROUTES.LOGISTICS.QR_SCAN}
        options={{
          headerShown: false,
          statusBarTranslucent: true,
          statusBarStyle: 'light',
          // 必须用不透明黑底：transparent 时相机未出画面前仍透出首页，体感像「跳转卡住」
          contentStyle: { backgroundColor: '#000000' },
          animation: 'none',
        }}
      />
      <Stack.Screen
        component={screens.ReceivingSearch}
        name={ROUTES.LOGISTICS.SEARCH}
        options={{
          headerShown: false,
          statusBarTranslucent: true,
          statusBarStyle: 'dark',
          contentStyle: { backgroundColor: designTokens.colors.gray[0] },
          animation: 'none',
        }}
      />
      <Stack.Screen
        component={screens.MaterialConfirmation}
        name={ROUTES.LOGISTICS.MATERIAL_CONFIRMATION}
        options={{
          title: '物料齐套确认',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerBackground: () => null,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        component={screens.ExceptionReplyList}
        name={ROUTES.LOGISTICS.EXCEPTION_REPLY_LIST}
        options={{
          title: '异常回复',
          contentStyle: { backgroundColor: '#F5F5F5' },
          headerStyle: { backgroundColor: designTokens.colors.gray[0] },
        }}
      />
      <Stack.Screen
        component={screens.CuttingRecords}
        name={ROUTES.LOGISTICS.CUTTING_RECORDS}
        options={{
          title: '裁床数记录',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerBackground: () => null,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        component={screens.SewingRecords}
        name={ROUTES.LOGISTICS.SEWING_RECORDS}
        options={{
          title: '车位记录',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerBackground: () => null,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        component={screens.PackingRecords}
        name={ROUTES.LOGISTICS.PACKING_RECORDS}
        options={{
          title: '尾部记录',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerBackground: () => null,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack.Navigator>
  );
};
