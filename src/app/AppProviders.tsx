import { ThemeProvider } from 'design-system-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useCareModeStore } from '@/store/careModeStore';
import { installCareModeFontPatch, setCareModeFontBoostEnabled } from '@/utils/careMode/fontBoost';

installCareModeFontPatch();

interface AppProvidersProps extends PropsWithChildren {
  systemColorMode: 'light' | 'dark';
}

export const AppProviders = ({ children, systemColorMode }: AppProvidersProps) => {
  const careModeEnabled = useCareModeStore((state) => state.enabled);

  // 同步写入，避免 Navigation remount 首帧仍用旧字号
  setCareModeFontBoostEnabled(careModeEnabled);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider colorMode={systemColorMode} locale="zh-CN">
          {children}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
