import { useIsFocused } from '@react-navigation/native';
import { Modal, Text } from 'design-system-native';
import type { GestureResponderEvent } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface ServiceAgreementModalProps {
  onAgree: () => void;
  onDisagree: () => void;
  open: boolean;
  title: string;
  onPressPrivacyPolicy: () => void;
  onPressUserServiceAgreement: () => void;
}

export const ServiceAgreementModal = ({
  onAgree,
  onDisagree,
  open,
  title,
  onPressPrivacyPolicy,
  onPressUserServiceAgreement,
}: ServiceAgreementModalProps) => {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();
  const visible = open && isFocused;

  return (
    <Modal
      visible={visible}
      onClose={onDisagree}
      title={title}
      content={
        <Text style={{ color: colors.text }}>
          阅读并同意
          <Text
            style={{ color: colors.primary }}
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              onPressUserServiceAgreement();
            }}
          >
            《用户协议》
          </Text>
          和
          <Text
            style={{ color: colors.primary }}
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              onPressPrivacyPolicy();
            }}
          >
            《隐私政策》
          </Text>
        </Text>
      }
      cancelText="不同意"
      okText="同意"
      onCancel={onDisagree}
      onOk={onAgree}
    />
  );
};
