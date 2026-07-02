import { useFocusEffect } from '@react-navigation/native';
import { type ReactNode, useCallback } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LOGIN_THEME } from '@/constants/loginTheme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';
import { getStatusBarContentStyle } from '@/navigation/stackScreenOptions';
import { getSafeAreaTopInset } from '@/utils/app';

interface LoginShellProps {
  children: ReactNode;
}

const LOGIN_STATUS_BAR_STYLE = 'dark-content' as const;

/**
 * 登录页容器：浅蓝灰背景 + 安全区避让。
 */
export const LoginShell = ({ children }: LoginShellProps) => {
  const insets = useSafeAreaInsets();
  const { colorMode } = useAppTheme();
  const topInset = getSafeAreaTopInset(insets.top);
  const bottomInset =
    Platform.OS === 'android' ? getAndroidGestureBottomInset(insets.bottom) : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }

      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setBarStyle(LOGIN_STATUS_BAR_STYLE);

      return () => {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setBarStyle(getStatusBarContentStyle(colorMode));
      };
    }, [colorMode]),
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          {
            paddingTop: topInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LOGIN_THEME.pageBg,
  },
  content: {
    flex: 1,
  },
});
