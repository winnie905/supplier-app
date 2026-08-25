import { ApolloProvider } from '@apollo/client/react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type NavigationState,
} from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { AppProviders } from '@/app/AppProviders';
import { navigationRef } from '@/app/navigationRef';
import { Loading } from '@/components/Loading';
import { apolloClient } from '@/graphql/client';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAppTheme } from '@/hooks/useAppTheme';
import { syncAndroidNavigationBar } from '@/navigation/androidNavigationBar';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppStore } from '@/store/appStore';
import { useCareModeStore } from '@/store/careModeStore';
import { useNetworkStore } from '@/store/networkStore';
import { initSessionPollingLifecycle } from '@/utils/auth/sessionPolling';

const AppContent = () => {
  const { isReady } = useAppInitialization();
  const { colorMode, colors } = useAppTheme();
  const { isLoading } = useAppStore();
  const careModeEnabled = useCareModeStore((state) => state.enabled);
  const [navState, setNavState] = useState<NavigationState | undefined>();

  useEffect(() => {
    const unsubscribe = useNetworkStore.getState().startNetworkListener();
    void useNetworkStore.getState().checkNetwork();
    return unsubscribe;
  }, []);

  useEffect(() => initSessionPollingLifecycle(), []);

  const navigationTheme = useMemo(
    () => ({
      ...(colorMode === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(colorMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        border: colors.border,
        card: colors.backgroundElevated,
        notification: colors.primary,
        primary: colors.primary,
        text: colors.text,
      },
    }),
    [colorMode, colors],
  );

  const syncNavigationBar = useCallback(() => {
    syncAndroidNavigationBar(navigationRef.getRootState(), colors);
  }, [colors]);

  const handleNavigationStateChange = useCallback(
    (state?: NavigationState) => {
      if (state) {
        setNavState(state);
      }
      syncNavigationBar();
    },
    [syncNavigationBar],
  );

  useEffect(() => {
    if (!isReady || Platform.OS !== 'android') {
      return;
    }

    syncNavigationBar();
  }, [isReady, syncNavigationBar]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    void BootSplash.hide({ fade: true });
  }, [isReady]);

  return (
    <>
      <Loading isLoading={isLoading} />
      <ApolloProvider client={apolloClient}>
        <NavigationContainer
          key={careModeEnabled ? 'care-on' : 'care-off'}
          ref={navigationRef}
          theme={navigationTheme}
          {...(navState ? { initialState: navState } : {})}
          onReady={syncNavigationBar}
          onStateChange={handleNavigationStateChange}
        >
          <RootNavigator />
        </NavigationContainer>
      </ApolloProvider>
    </>
  );
};

const App = () => {
  const systemColorScheme = useColorScheme();

  return (
    <AppProviders systemColorMode={systemColorScheme === 'dark' ? 'dark' : 'light'}>
      <AppContent />
    </AppProviders>
  );
};

export default App;
