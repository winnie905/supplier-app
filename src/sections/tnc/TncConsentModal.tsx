import { useIsFocused } from '@react-navigation/native';
import { Checkbox, CheckboxIndicator, CheckIcon, Text } from 'design-system-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppModal } from '@/components/AppModal';
import { useAppTheme } from '@/hooks/useAppTheme';

const SECONDARY_TEXT_COLOR = '#8A98AD';

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
  const [checked, setChecked] = useState(false);
  const visible = open && isFocused;

  useEffect(() => {
    if (!visible) {
      setChecked(false);
    }
  }, [visible]);

  const handleAgree = () => {
    if (!checked || isSubmitting) {
      return;
    }

    onAgree();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onDisagree}
      closeOnBackdropPress={false}
      title="服务协议及隐私政策"
      cancelText="不同意"
      okText={isSubmitting ? '提交中...' : '同意'}
      onCancel={onDisagree}
      onOk={handleAgree}
      okStyle={!checked || isSubmitting ? styles.disabledOk : undefined}
      okTextStyle={
        !checked || isSubmitting
          ? {
              color: SECONDARY_TEXT_COLOR,
              fontSize: tokens.typography.fontSize.lg,
            }
          : undefined
      }
    >
      <View style={styles.contentBlock}>
        <View style={styles.checkboxRow}>
          <Checkbox
            value="tnc-consent"
            isChecked={checked}
            onChange={setChecked}
            style={styles.checkboxTouchArea}
          >
            <CheckboxIndicator
              style={{
                width: 16,
                height: 16,
                borderRadius: 10,
                borderWidth: checked ? 0 : 1,
                borderColor: '#DADEE5',
                backgroundColor: checked ? colors.primary : '#fff',
              }}
            >
              {checked ? (
                <CheckIcon width={12} height={12} color="#FFFFFF" strokeWidth={3} />
              ) : null}
            </CheckboxIndicator>
          </Checkbox>
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
        </View>
        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : null}
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  contentBlock: {
    width: '100%',
    marginTop: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  checkboxTouchArea: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementText: {
    flex: 1,
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
