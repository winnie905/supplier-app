import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Keyboard,
  ScrollView,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import CloseIcon from '@/assets/icons/close.svg';
import { AppModal } from '@/components/AppModal';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

export type DrawerModalHeight = 'auto' | 'max' | number;

export interface DrawerModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** 抽屉高度：auto 自适应（不超过屏高）、max 顶到安全区、或固定像素 */
  height?: DrawerModalHeight;
  showCloseButton?: boolean;
  showBackButton?: boolean;
  closeOnBackdropPress?: boolean;
  sheetStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  /** 是否使用内部 ScrollView，列表类内容可设为 false */
  scrollable?: boolean;
}

/**
 * 底部抽屉式弹窗通用壳：标题 + 关闭/返回 + 可滚动内容区 + 可选底部操作区。
 * 键盘弹起时整体上移，避免遮挡输入框；关闭时自动收起键盘。
 */
export const DrawerModal = ({
  visible,
  title,
  onClose,
  children,
  footer,
  height = 'auto',
  showCloseButton = true,
  showBackButton = false,
  closeOnBackdropPress = true,
  sheetStyle,
  bodyStyle,
  contentContainerStyle,
  titleStyle,
  headerStyle,
  scrollable = true,
}: DrawerModalProps) => {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight(visible);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  // 键盘弹起后滚到内容底部，确保靠下的输入框进入可视区
  useEffect(() => {
    if (keyboardHeight <= 0 || !scrollable) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [keyboardHeight, scrollable]);

  /** 键盘上方可用高度（整页上移后留给抽屉的空间） */
  const availableHeight = Math.max(
    window.height - insets.top - keyboardHeight,
    window.height * 0.35,
  );

  const sheetHeightStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (height === 'max') {
      return {
        height: availableHeight,
      };
    }
    if (height === 'auto') {
      return {
        maxHeight: availableHeight,
      };
    }
    return {
      height: Math.min(height, availableHeight),
    };
  }, [availableHeight, height]);

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      animationType="slide"
      closeOnBackdropPress={closeOnBackdropPress}
      backdropStyle={styles.modalRoot}
      cardStyle={[
        styles.sheet,
        sheetHeightStyle,
        {
          // 安全区底边距；键盘弹起时用 marginBottom 把抽屉整体抬到键盘上方
          paddingBottom: Math.max(insets.bottom, 16),
          marginBottom: keyboardHeight,
        },
        sheetStyle,
      ]}
    >
      <View style={[styles.sheetHeader, headerStyle]}>
        {showBackButton ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClose}
            style={styles.backButton}
          >
            <BackIcon width={20} height={20} color="#111111" />
          </Pressable>
        ) : null}
        <Text style={[styles.sheetTitle, titleStyle]}>{title}</Text>
        {showCloseButton ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClose}
            style={styles.closeButton}
          >
            <CloseIcon width={16} height={16} color="#061B37" />
          </Pressable>
        ) : null}
      </View>

      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={[styles.body, height === 'max' ? styles.bodyFlex : null, bodyStyle]}
          contentContainerStyle={[styles.bodyContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, height === 'max' ? styles.bodyFlex : null, bodyStyle]}>
          {children}
        </View>
      )}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sheetHeader: {
    height: 36,
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#021626',
    textAlign: 'center',
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyFlex: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 8,
    gap: 16,
    flexGrow: 1,
  },
  footer: {
    paddingTop: 12,
  },
});
