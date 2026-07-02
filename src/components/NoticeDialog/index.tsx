import { Text, VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import NoticeIcon from '@/assets/icons/notice.svg';
import { AppModal } from '@/components/AppModal';
import { FlatButton } from '@/components/FlatButton';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface NoticeDialogProps {
  confirmText: string;
  content: string;
  onConfirm: () => void;
  visible: boolean;
  closeOnBackdropPress?: boolean;
  confirmButtonStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
  backdropStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
}

export const NoticeDialog = ({
  closeOnBackdropPress = false,
  confirmButtonStyle,
  confirmText,
  content,
  contentStyle,
  icon,
  onConfirm,
  visible,
  backdropStyle,
  cardStyle,
}: NoticeDialogProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <AppModal
      visible={visible}
      onClose={onConfirm}
      animationType="fade"
      closeOnBackdropPress={closeOnBackdropPress}
      backdropStyle={[styles.backdrop, backdropStyle]}
      cardStyle={[
        styles.card,
        { backgroundColor: colors.backgroundElevated, borderRadius: tokens.radius.lg },
        cardStyle,
      ]}
    >
      <VStack style={{ alignItems: 'center', gap: tokens.spacing.md }}>
        {icon ?? <NoticeIcon color={colors.primary} height={30} width={30} />}
        <Text style={[styles.content, contentStyle]}>{content}</Text>
        <FlatButton style={[{ width: '100%' }, confirmButtonStyle]} onPress={onConfirm}>
          {confirmText}
        </FlatButton>
      </VStack>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 45,
    backgroundColor: 'none',
  },
  card: {
    maxWidth: 400,
    padding: 16,
    width: '100%',
  },
  content: {
    color: '#021626',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 36,
  },
});
