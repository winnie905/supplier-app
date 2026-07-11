import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import CloseIcon from '@/assets/icons/close.svg';
import { AppModal } from '@/components/AppModal';

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
  /** 是否使用内部 ScrollView，列表类内容可设为 false */
  scrollable?: boolean;
}

/**
 * 底部抽屉式弹窗通用壳：标题 + 关闭/返回 + 可滚动内容区 + 可选底部操作区。
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
  scrollable = true,
}: DrawerModalProps) => {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const maxSheetHeight = window.height - insets.top;

  const sheetHeightStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (height === 'max') {
      return {
        flex: 1,
        marginTop: insets.top,
      };
    }
    if (height === 'auto') {
      return {
        maxHeight: maxSheetHeight,
      };
    }
    return {
      height: Math.min(height, maxSheetHeight),
    };
  }, [height, insets.top, maxSheetHeight]);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      closeOnBackdropPress={closeOnBackdropPress}
      backdropStyle={styles.modalRoot}
      cardStyle={[
        styles.sheet,
        sheetHeightStyle,
        { paddingBottom: Math.max(insets.bottom, 16) },
        sheetStyle,
      ]}
    >
      <View style={styles.sheetHeader}>
        {showBackButton ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.backButton}
          >
            <BackIcon width={20} height={20} color="#111111" />
          </Pressable>
        ) : null}
        <Text style={styles.sheetTitle}>{title}</Text>
        {showCloseButton ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <CloseIcon width={16} height={16} color="#061B37" />
          </Pressable>
        ) : null}
      </View>

      {scrollable ? (
        <ScrollView
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
  },
  bodyFlex: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 8,
    gap: 16,
  },
  footer: {
    paddingTop: 12,
  },
});
