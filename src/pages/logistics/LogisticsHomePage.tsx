import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';

import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingHomeContent } from '@/pages/receiving/ReceivingHomeContent';
import { getSafeAreaTopInset } from '@/utils/app';

type LogisticsHomePageProps = LogisticsScreenProps<'LogisticsHome'>;

/**
 * 收发首页：扫码/搜索走 Stack 直达。
 * 注意：本页有 useIsFocused，focus 变化会重渲；必须把重型 ReceivingHomeContent memo 住，
 * 且用稳定 props，否则子页首屏 commit 会被首页树拖死（NavPerf ~8s）。
 */
export const LogisticsHomePage = ({ navigation, route }: LogisticsHomePageProps) => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets.top);

  useEffect(() => {
    if (!isFocused) return;
    const status = Camera.getCameraPermissionStatus();
    if (status === 'not-determined') {
      void Camera.requestCameraPermission();
    }
  }, [isFocused]);

  // 稳定 element，避免父重渲时对 memo 子组件传入新的 props 对象引用
  const homeContent = useMemo(
    () => <ReceivingHomeContent navigation={navigation} route={route} />,
    [navigation, route],
  );

  return (
    <View style={[styles.container, topInset > 0 && { marginTop: -topInset }]}>{homeContent}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
