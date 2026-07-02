import { Button, HStack, Text } from 'design-system-native';
import type { PropsWithChildren, ReactNode } from 'react';
import type { ModalProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface AppModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;

  /**
   * 点击遮罩是否关闭弹窗。
   * 默认 true。
   */
  closeOnBackdropPress?: boolean;

  /**
   * 弹窗外层遮罩样式。
   */
  backdropStyle?: StyleProp<ViewStyle>;

  /**
   * 弹窗卡片外层样式。
   */
  cardStyle?: StyleProp<ViewStyle>;

  /**
   * React Native Modal 动画类型。
   */
  animationType?: ModalProps['animationType'];

  /**
   * 弹窗标题。
   */
  title?: ReactNode;

  /**
   * 弹窗标题样式。
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * 弹窗内容。
   */
  content?: ReactNode;

  /**
   * 弹窗内容样式。
   */
  contentStyle?: StyleProp<TextStyle>;

  /**
   * 弹窗底部确认按钮文本。
   */
  okText?: string;

  /**
   * 弹窗底部确认按钮点击事件。
   */
  onOk?: () => void;

  /**
   * 弹窗底部取消按钮文本。
   */
  cancelText?: string;

  /**
   * 弹窗底部取消按钮点击事件。
   */
  onCancel?: () => void;

  /**
   * 弹窗底部确认按钮样式。
   */
  okStyle?: StyleProp<ViewStyle>;

  /**
   * 弹窗底部取消按钮样式。
   */
  cancelStyle?: StyleProp<ViewStyle>;

  /**
   * 弹窗底部确认按钮文字样式。
   */
  okTextStyle?: StyleProp<TextStyle>;

  /**
   * 弹窗底部取消按钮文字样式。
   */
  cancelTextStyle?: StyleProp<TextStyle>;

  /**
   * 仅渲染蒙层 + children，不使用默认居中卡片容器。
   * 适用于全屏弹窗、底部 Sheet、复杂自定义布局。
   */
  bare?: boolean;
}

/**
 * App 通用居中弹窗。
 *
 * 负责：
 * 1. 原生 Modal 容器；
 * 2. 半透明遮罩；
 * 3. 居中卡片；
 * 4. 点击遮罩关闭。
 *
 * 注意：
 * 卡片区域使用普通 View 即可。遮罩 Pressable 与卡片是兄弟节点，
 * 点击卡片时命中的是卡片本身，不会触发下层遮罩，不需要 stopPropagation。
 */
export const AppModal = ({
  visible,
  onClose,
  closeOnBackdropPress = true,
  backdropStyle,
  cardStyle,
  animationType = 'none',
  children,
  title,
  titleStyle,
  content,
  contentStyle,
  okText,
  onOk,
  cancelText,
  onCancel,
  okStyle,
  cancelStyle,
  okTextStyle,
  cancelTextStyle,
  bare = false,
}: AppModalProps) => {
  const { colors, tokens } = useAppTheme();

  const shouldRenderDefaultFooter = !!cancelText || !!okText;

  return (
    <Modal
      animationType={animationType}
      transparent
      visible={visible}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, backdropStyle]}>
        {closeOnBackdropPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭弹窗"
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        ) : null}

        {bare ? (
          children
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElevated,
                borderRadius: tokens.radius.lg,
              },
              cardStyle,
            ]}
          >
            {title ? (
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    fontWeight: tokens.typography.fontWeight.bold,
                  },
                  titleStyle,
                ]}
              >
                {title}
              </Text>
            ) : null}

            {content ? (
              <Text
                style={[
                  styles.content,
                  {
                    fontSize: tokens.typography.fontSize.md,
                  },
                  contentStyle,
                ]}
              >
                {content}
              </Text>
            ) : null}

            {children}

            {shouldRenderDefaultFooter ? (
              <HStack style={styles.defaultFooter}>
                {cancelText ? (
                  <View style={styles.footerButtonWrapper}>
                    <Button
                      onPress={onCancel ?? onClose}
                      style={[
                        styles.footerButton,
                        styles.cancelButton,
                        {
                          borderColor: colors.primary,
                        },
                        cancelStyle,
                      ]}
                      textStyle={[
                        styles.footerButtonText,
                        {
                          color: colors.primary,
                          fontSize: tokens.typography.fontSize.lg,
                        },
                        cancelTextStyle,
                      ]}
                    >
                      {cancelText}
                    </Button>
                  </View>
                ) : null}

                {okText ? (
                  <View style={styles.footerButtonWrapper}>
                    <Button
                      onPress={onOk}
                      style={[
                        styles.footerButton,
                        {
                          backgroundColor: colors.primary,
                          borderWidth: 0,
                        },
                        okStyle,
                      ]}
                      textStyle={[
                        styles.footerButtonText,
                        {
                          color: colors.textInverse,
                          fontSize: tokens.typography.fontSize.lg,
                        },
                        okTextStyle,
                      ]}
                    >
                      {okText}
                    </Button>
                  </View>
                ) : null}
              </HStack>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  card: {
    width: '100%',
    maxWidth: 400,
    padding: 16,
  },

  title: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },

  content: {
    marginTop: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#021626',
  },

  defaultFooter: {
    marginTop: 28,
    gap: 12,
  },

  footerButtonWrapper: {
    flex: 1,
  },

  footerButton: {
    height: 44,
  },

  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },

  footerButtonText: {
    fontWeight: '500',
  },
});
