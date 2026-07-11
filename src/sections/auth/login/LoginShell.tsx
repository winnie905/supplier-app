import { useFocusEffect } from '@react-navigation/native';
import { type ReactNode, useCallback } from 'react';
import { ImageBackground, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authLoginBackgroundImage } from '@/components/images';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';
import { getStatusBarContentStyle } from '@/navigation/stackScreenOptions';
import { getSafeAreaTopInset } from '@/utils/app';

interface LoginShellProps {
  children: ReactNode;
}

const LOGIN_STATUS_BAR_STYLE = 'dark-content' as const;

/**
 * 登录页全屏背景：背景图铺满屏幕，内容区避让安全区。
 * 背景限制在 root 内（overflow: hidden），避免 Android 切换根导航时子视图仍挂在旧父节点上。
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
      <ImageBackground
        resizeMode="cover"
        source={authLoginBackgroundImage}
        style={StyleSheet.absoluteFill}
      />
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
    overflow: 'hidden',
    backgroundColor: '#EFF4FF',
  },
  content: {
    flex: 1,
  },
});
