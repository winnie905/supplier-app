import { ThemeProvider } from 'design-system-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface AppProvidersProps extends PropsWithChildren {
  systemColorMode: 'light' | 'dark';
}

export const AppProviders = ({ children, systemColorMode }: AppProvidersProps) => {
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
