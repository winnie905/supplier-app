import { useIsFocused } from '@react-navigation/native';
import { designTokens, Modal, Text } from 'design-system-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface TncConsentModalProps {
  open: boolean;
  isSubmitting?: boolean;
  onAgree: () => void;
  onDisagree: () => void;
  onPressPrivacyPolicy: () => void;
  onPressUserServiceAgreement: () => void;
}

/**
 * 登录页协议确认弹窗。
 * 依赖 useIsFocused：跳转到协议详情后自动隐藏，返回登录页后恢复显示。
 */
export const TncConsentModal = ({
  open,
  isSubmitting = false,
  onAgree,
  onDisagree,
  onPressPrivacyPolicy,
  onPressUserServiceAgreement,
}: TncConsentModalProps) => {
  const { colors, tokens } = useAppTheme();
  const isFocused = useIsFocused();
  const visible = open && isFocused;

  const handleAgree = () => {
    if (isSubmitting) {
      return;
    }

    onAgree();
  };

  return (
    <Modal
      visible={visible}
      onClose={onDisagree}
      closeOnBackdropPress={false}
      title="服务协议及隐私政策"
      cancelText="不同意"
      okText={isSubmitting ? '请稍候...' : '同意'}
      onCancel={onDisagree}
      onOk={handleAgree}
      okStyle={isSubmitting ? styles.disabledOk : undefined}
      okTextStyle={
        isSubmitting
          ? {
              color: designTokens.colors.gray[0],
              fontSize: tokens.typography.fontSize.lg,
            }
          : undefined
      }
    >
      <View style={styles.contentBlock}>
        <Text style={[styles.agreementText, { color: colors.text }]}>
          阅读并同意
          <Text style={{ color: colors.primary }} onPress={onPressUserServiceAgreement}>
            《用户协议》
          </Text>
          和
          <Text style={{ color: colors.primary }} onPress={onPressPrivacyPolicy}>
            《隐私政策》
          </Text>
        </Text>
        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contentBlock: {
    width: '100%',
    marginTop: 16,
  },
  agreementText: {
    lineHeight: 22,
    fontSize: 14,
    textAlign: 'left',
  },
  loadingRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  disabledOk: {
    opacity: 0.5,
  },
});
