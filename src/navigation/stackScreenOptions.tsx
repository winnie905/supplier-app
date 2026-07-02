import { getHeaderTitle, Header } from '@react-navigation/elements';
import type { ParamListBase } from '@react-navigation/native';
import type {
  NativeStackHeaderProps,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import type { useAppTheme } from '@/hooks/useAppTheme';
import { androidHiddenNavigationBarScreenOptions } from '@/navigation/androidNavigationBar';
import { getSafeAreaTopInset } from '@/utils/app';

/** Header 返回图标距屏幕左侧视觉间距 */
const HEADER_BACK_LEFT_PADDING = 16;

// —— 状态栏 ————————————————————————————————————————————————————————————————————

export type StatusBarContentStyle = 'light-content' | 'dark-content';
export type NativeStackStatusBarStyle = 'light' | 'dark';

export const getStatusBarContentStyle = (colorMode: 'light' | 'dark'): StatusBarContentStyle =>
  colorMode === 'dark' ? 'light-content' : 'dark-content';

export const getNativeStackStatusBarStyle = (
  colorMode: 'light' | 'dark',
): NativeStackStatusBarStyle => (colorMode === 'dark' ? 'light' : 'dark');

export const NATIVE_STACK_STATUS_BAR_ON_LIGHT_BG: NativeStackStatusBarStyle = 'dark';

const StackSafeAreaHeader = ({ back, options, route }: NativeStackHeaderProps) => {
  const insets = useSafeAreaInsets();
  const title = getHeaderTitle(options, route.name);

  return (
    <Header
      title={title}
      headerStatusBarHeight={getSafeAreaTopInset(insets.top)}
      {...(back != null ? { back } : {})}
      {...(options.headerBackButtonDisplayMode != null
        ? { headerBackButtonDisplayMode: options.headerBackButtonDisplayMode }
        : {})}
      {...(options.headerLeft != null ? { headerLeft: options.headerLeft } : {})}
      {...(options.headerRight != null ? { headerRight: options.headerRight } : {})}
      {...(options.headerShadowVisible != null
        ? { headerShadowVisible: options.headerShadowVisible }
        : {})}
      {...(options.headerStyle != null ? { headerStyle: options.headerStyle } : {})}
      {...(options.headerTintColor != null ? { headerTintColor: options.headerTintColor } : {})}
      {...(options.headerTitle != null ? { headerTitle: options.headerTitle } : {})}
      {...(options.headerTitleAlign != null ? { headerTitleAlign: options.headerTitleAlign } : {})}
      {...(options.headerTitleStyle != null ? { headerTitleStyle: options.headerTitleStyle } : {})}
      {...(options.headerTransparent != null
        ? { headerTransparent: options.headerTransparent }
        : {})}
    />
  );
};

// —— 返回按钮（全平台统一 16px 左间距，隐藏系统默认返回键）————————————————————

const createHeaderLeft =
  (navigation: { goBack: () => void }) =>
  ({ canGoBack, tintColor }: { canGoBack?: boolean; tintColor?: string }) => {
    if (!canGoBack) {
      return null;
    }

    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={navigation.goBack}
        style={styles.backButton}
      >
        <BackIcon {...(tintColor != null ? { color: tintColor } : {})} height={22} width={22} />
      </Pressable>
    );
  };

const createBaseScreenOptions = (navigation: {
  goBack: () => void;
}): NativeStackNavigationOptions => ({
  headerBackVisible: false,
  headerBackTitle: '',
  headerLeft: createHeaderLeft(navigation),
  headerTitleAlign: 'center',
});

// —— 路由层全屏背景 + 安全区内边距 ——————————————————————————————————————————————

export interface StackScreenLayoutProps {
  children: ReactNode;
  backgroundColor: string;
  safeTop?: boolean;
  safeBottom?: boolean;
}

export const StackScreenLayout = ({
  children,
  backgroundColor,
  safeTop = false,
  safeBottom = false,
}: StackScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[layoutStyles.root, { backgroundColor }]}>
      <View
        style={[
          layoutStyles.content,
          {
            paddingTop: safeTop ? insets.top : 0,
            paddingBottom: safeBottom ? insets.bottom : 0,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

type StackScreenLayoutConfig = Omit<StackScreenLayoutProps, 'children'>;

/**
 * native-stack 7.x 无 screenLayout，用 HOC 在路由层统一包裹页面背景与安全区。
 */
export function withStackScreenLayout<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
>(
  Screen: ComponentType<NativeStackScreenProps<ParamList, RouteName>>,
  layoutConfig: StackScreenLayoutConfig,
): ComponentType<NativeStackScreenProps<ParamList, RouteName>> {
  const displayName = Screen.displayName ?? Screen.name ?? 'Screen';

  const WrappedScreen = (props: NativeStackScreenProps<ParamList, RouteName>) => (
    <StackScreenLayout {...layoutConfig}>
      <Screen {...props} />
    </StackScreenLayout>
  );

  WrappedScreen.displayName = `WithStackScreenLayout(${displayName})`;

  return WrappedScreen;
}

// —— Stack 公共 screenOptions ——————————————————————————————————————————————————

type AppTheme = ReturnType<typeof useAppTheme>;

interface CreateStackScreenOptionsParams {
  navigation: {
    goBack: () => void;
  };
  colors: AppTheme['colors'];
  colorMode: AppTheme['colorMode'];
  tokens: AppTheme['tokens'];
  overrides?: NativeStackNavigationOptions;
}

export const createStackScreenOptions = ({
  navigation,
  colors,
  colorMode,
  tokens,
  overrides,
}: CreateStackScreenOptionsParams): NativeStackNavigationOptions => ({
  ...createBaseScreenOptions(navigation),
  animation: 'none',
  header: (props) => <StackSafeAreaHeader {...props} />,
  contentStyle: {
    backgroundColor: colors.background,
  },
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    color: colors.text,
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  statusBarTranslucent: true,
  statusBarStyle: getNativeStackStatusBarStyle(colorMode),
  ...androidHiddenNavigationBarScreenOptions,
  ...overrides,
});

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingLeft: HEADER_BACK_LEFT_PADDING,
  },
});

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
