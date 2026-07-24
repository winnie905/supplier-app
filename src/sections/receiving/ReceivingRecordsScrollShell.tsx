import type { PropsWithChildren, ReactNode, RefObject } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

type ReceivingRecordsScrollShellProps = PropsWithChildren<{
  headerHeight: number;
  scrollRef: RefObject<ScrollView | null>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentBottomInset: number;
  rootKeyboardInset: number;
  /** ScrollView 内容下方的操作栏 / sheet 等 */
  footer?: ReactNode;
  contentGap?: number;
}>;

/** 裁床/车位/尾部共用：键盘抬高根容器 + 可滚动内容区 */
export const ReceivingRecordsScrollShell = ({
  headerHeight,
  scrollRef,
  onScroll,
  contentBottomInset,
  rootKeyboardInset,
  footer,
  contentGap = 10,
  children,
}: ReceivingRecordsScrollShellProps) => (
  <View style={[styles.root, { paddingBottom: rootKeyboardInset }]}>
    <ScrollView
      ref={scrollRef}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={[styles.scrollView, { marginTop: headerHeight }]}
      contentContainerStyle={[
        styles.scroll,
        { gap: contentGap, paddingBottom: contentBottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
    {footer}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scroll: {},
});
