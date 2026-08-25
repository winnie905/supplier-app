import { useCallback, useEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';
import {
  Dimensions,
  findNodeHandle,
  type FocusEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

type MeasureCallback = (x: number, y: number, width: number, height: number) => void;

const measureTargetInWindow = (target: unknown, callback: MeasureCallback) => {
  const measurable = target as { measureInWindow?: (cb: MeasureCallback) => void };
  if (typeof measurable?.measureInWindow === 'function') {
    measurable.measureInWindow(callback);
    return;
  }
  const handle = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
  if (handle == null) return;
  UIManager.measureInWindow(handle, callback);
};

/** 底部提交栏内容高度（不含安全区）：paddingTop 12 + 按钮 45 */
const BOTTOM_BAR_CONTENT_HEIGHT = 57;

/**
 * 收发记录页键盘避让：
 * - 页面底部垫高 = 键盘高度，整页（含提交栏）抬到键盘上方
 * - 焦点输入框滚入可视区
 * 适配 Android windowSoftInputMode=adjustNothing
 */
export const useKeyboardAwareScroll = (options?: { extraOffset?: number }) => {
  const extraOffset = options?.extraOffset ?? 20;
  const insets = useSafeAreaInsets();
  const bottomBarHeight = BOTTOM_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 12);

  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const focusedTargetRef = useRef<unknown>(null);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (keyboardHeight <= 0) {
      focusedTargetRef.current = null;
    }
  }, [keyboardHeight]);

  const scrollFocusedIntoView = useCallback(
    (target: unknown, kbHeight: number) => {
      if (kbHeight <= 0) return;
      measureTargetInWindow(target, (_x, y, _w, h) => {
        const screenH = Dimensions.get('window').height;
        // 整页已上移 kbHeight，提交栏仍在键盘上方
        const visibleBottom = screenH - kbHeight - bottomBarHeight - extraOffset;
        const inputBottom = y + h;
        if (inputBottom <= visibleBottom) return;
        const delta = inputBottom - visibleBottom;
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollYRef.current + delta),
          animated: true,
        });
      });
    },
    [bottomBarHeight, extraOffset],
  );

  useEffect(() => {
    if (keyboardHeight <= 0 || focusedTargetRef.current == null) return;
    const timer = setTimeout(
      () => {
        if (focusedTargetRef.current != null) {
          scrollFocusedIntoView(focusedTargetRef.current, keyboardHeight);
        }
      },
      Platform.OS === 'ios' ? 32 : 64,
    );
    return () => clearTimeout(timer);
  }, [keyboardHeight, scrollFocusedIntoView]);

  const onInputFocus = useCallback(
    (event: FocusEvent) => {
      focusedTargetRef.current = event.target;
      if (keyboardHeight > 0) {
        setTimeout(() => {
          scrollFocusedIntoView(event.target, keyboardHeight);
        }, 50);
      }
    },
    [keyboardHeight, scrollFocusedIntoView],
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  return {
    scrollRef,
    onInputFocus,
    onScroll,
    /** 根容器 paddingBottom：键盘弹起时整页上移 */
    rootKeyboardInset: keyboardHeight,
    /** ScrollView 在底栏上方保留 16，底栏已在文档流中占位 */
    contentBottomInset: 16,
    keyboardHeight,
  };
};
