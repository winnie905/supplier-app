import React from 'react';
import jsxDevRuntime from 'react/jsx-dev-runtime';
import jsxRuntime from 'react/jsx-runtime';
import { type StyleProp, StyleSheet, Text, TextInput, type TextStyle } from 'react-native';

import { CARE_MODE_FONT_BOOST } from '@/store/careModeStore';

const CARE_BOOST_MARKER = '__careModeFontBoosted';

let fontBoostEnabled = false;
let patchInstalled = false;

export const setCareModeFontBoostEnabled = (enabled: boolean) => {
  fontBoostEnabled = enabled;
};

interface PropsWithStyle {
  style?: StyleProp<TextStyle>;
}

const boostPropsStyle = (props: PropsWithStyle | null | undefined): typeof props => {
  if (!fontBoostEnabled || props == null) return props;

  const flat = StyleSheet.flatten(props.style) as
    | (TextStyle & { [CARE_BOOST_MARKER]?: boolean })
    | undefined;

  if (!flat || typeof flat.fontSize !== 'number') {
    // 未显式设置 fontSize 的节点保持继承，避免嵌套 Text 被错误改写
    return props;
  }

  if (flat[CARE_BOOST_MARKER]) {
    return props;
  }

  return {
    ...props,
    style: [
      props.style,
      {
        fontSize: flat.fontSize + CARE_MODE_FONT_BOOST,
        [CARE_BOOST_MARKER]: true,
      } as TextStyle,
    ],
  };
};

const isTextLikeType = (type: unknown): boolean => {
  if (type === Text || type === TextInput) return true;
  if (typeof type === 'string') {
    return type === 'Text' || type === 'TextInput' || type === 'RCTText' || type === 'RCTRawText';
  }
  if ((typeof type !== 'object' && typeof type !== 'function') || type == null) {
    return false;
  }

  const meta = type as {
    displayName?: string;
    name?: string;
    render?: { displayName?: string; name?: string };
  };
  const label = meta.displayName ?? meta.name ?? meta.render?.displayName ?? meta.render?.name;
  if (!label) return false;

  return (
    label === 'Text' ||
    label === 'TextInput' ||
    label.endsWith('.Text') ||
    label.endsWith('.TextInput') ||
    /Text$/i.test(label)
  );
};

const maybeBoost = (type: unknown, props: unknown) => {
  if (!isTextLikeType(type)) return props;
  return boostPropsStyle(props as PropsWithStyle | null);
};

/**
 * 拦截 createElement / jsx-runtime，给显式设置了 fontSize 的文本节点 +关怀模式增量。
 * 需在应用启动尽早调用一次。
 */
export const installCareModeFontPatch = () => {
  if (patchInstalled) return;
  patchInstalled = true;

  const originalCreateElement = React.createElement.bind(React);
  /* createElement / jsx-runtime 无统一 overload，补丁只能放宽类型 */
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
  (React as any).createElement = (type: any, props: any, ...children: any[]) =>
    originalCreateElement(type, maybeBoost(type, props) as typeof props, ...children);

  const patchJsxFn = (fn: (...args: never[]) => unknown) => {
    return ((type: any, props: any, ...rest: any[]) =>
      (fn as any)(type, maybeBoost(type, props), ...rest)) as typeof fn;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

  // Metro / RN 默认 automatic JSX runtime，仅补丁 createElement 不够
  (jsxRuntime as { jsx: typeof jsxRuntime.jsx }).jsx = patchJsxFn(
    jsxRuntime.jsx as (...args: never[]) => unknown,
  ) as typeof jsxRuntime.jsx;
  (jsxRuntime as { jsxs: typeof jsxRuntime.jsxs }).jsxs = patchJsxFn(
    jsxRuntime.jsxs as (...args: never[]) => unknown,
  ) as typeof jsxRuntime.jsxs;
  (jsxDevRuntime as { jsxDEV: typeof jsxDevRuntime.jsxDEV }).jsxDEV = patchJsxFn(
    jsxDevRuntime.jsxDEV as (...args: never[]) => unknown,
  ) as typeof jsxDevRuntime.jsxDEV;
};
