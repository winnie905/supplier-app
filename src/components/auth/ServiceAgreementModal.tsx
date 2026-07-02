import { useIsFocused } from '@react-navigation/native';
import { Text } from 'design-system-native';

import { AppModal } from '@/components/AppModal';
import { AUTH_STRINGS } from '@/constants/legalContent';
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
    <AppModal
      visible={visible}
      onClose={onDisagree}
      title={title}
      content={
        <Text style={{ color: colors.text }}>
          阅读并同意
          <Text
            style={{ color: colors.primary }}
            onPress={(event) => {
              event.stopPropagation();
              onPressUserServiceAgreement();
            }}
          >
            《用户服务协议》
          </Text>
          和
          <Text
            style={{ color: colors.primary }}
            onPress={(event) => {
              event.stopPropagation();
              onPressPrivacyPolicy();
            }}
          >
            《隐私政策》
          </Text>
        </Text>
      }
      cancelText={AUTH_STRINGS.disagree}
      okText={AUTH_STRINGS.agree}
      onCancel={onDisagree}
      onOk={onAgree}
    />
  );
};
