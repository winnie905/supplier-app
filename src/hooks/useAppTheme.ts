import { useColorMode, useTheme } from 'design-system-native';
import { useMemo } from 'react';

const APP_COLOR_OVERRIDES = {
  text: '#182A43',
  primary: '#105FC8',
} as const;

export const useAppTheme = () => {
  const themeState = useTheme();
  const colorModeState = useColorMode();

  /**
   * 避免每次调用 useAppTheme 都创建新的 colors 对象，
   * 否则下游依赖 colors 的 useMemo / useCallback / React.memo 会频繁失效。
   */
  const colors = useMemo(
    () => ({
      ...themeState.colors,
      ...APP_COLOR_OVERRIDES,
    }),
    [themeState.colors],
  );

  /**
   * 保持返回对象引用尽量稳定。
   *
   * 注意：如果 useTheme/useColorMode 本身每次都返回新对象，
   * 这里的外层对象仍可能变化；但至少 colors 不会在主题色未变化时重复创建。
   */
  return useMemo(
    () => ({
      ...themeState,
      ...colorModeState,
      colors,
    }),
    [themeState, colorModeState, colors],
  );
};
