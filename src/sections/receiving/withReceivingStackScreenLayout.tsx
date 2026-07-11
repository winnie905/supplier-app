import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';

import { withStackScreenLayout } from '@/navigation/stackScreenOptions';
import { ReceivingScreenShell } from '@/sections/receiving/ReceivingScreenBackground';

/**
 * 收发二级页路由层包裹：透明栈底 + 全屏收发背景图。
 */
export function withReceivingStackScreenLayout<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
>(Screen: ComponentType<NativeStackScreenProps<ParamList, RouteName>>) {
  const ScreenWithBackground = (props: NativeStackScreenProps<ParamList, RouteName>) => (
    <ReceivingScreenShell>
      <Screen {...props} />
    </ReceivingScreenShell>
  );

  ScreenWithBackground.displayName = `ReceivingScreen(${
    Screen.displayName ?? Screen.name ?? 'Screen'
  })`;

  return withStackScreenLayout(ScreenWithBackground, { backgroundColor: 'transparent' });
}
