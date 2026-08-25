import { Checkbox, CheckboxIndicator, CheckIcon, designTokens, Text } from 'design-system-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface LoginAgreementSectionProps {
  agreed: boolean;
  onChange: (value: boolean) => void;
  onPressPrivacyPolicy: () => void;
  onPressUserServiceAgreement: () => void;
  style?: StyleProp<ViewStyle>;
}

export const LoginAgreementSection = ({
  agreed,
  onChange,
  onPressPrivacyPolicy,
  onPressUserServiceAgreement,
  style,
}: LoginAgreementSectionProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <View style={[styles.row, style]}>
      <Checkbox
        value="agreement"
        isChecked={agreed}
        onChange={(checked) => onChange(checked)}
        style={styles.checkboxTouchArea}
      >
        <CheckboxIndicator
          style={{
            width: 16,
            height: 16,
            borderRadius: 10,
            borderWidth: agreed ? 0 : 1,
            borderColor: designTokens.colors.gray[200],
            backgroundColor: agreed ? colors.primary : '#fff',
          }}
        >
          {agreed && (
            <CheckIcon width={12} height={12} color={designTokens.colors.gray[0]} strokeWidth={3} />
          )}
        </CheckboxIndicator>
      </Checkbox>
      <View style={styles.textWrap}>
        <Text style={{ color: '#8A98AD', fontSize: tokens.typography.fontSize.sm }}>
          阅读并同意
          <Text
            style={{ color: colors.primary, fontSize: tokens.typography.fontSize.sm }}
            onPress={(event) => {
              event.stopPropagation();
              onPressUserServiceAgreement();
            }}
          >
            《用户协议》
          </Text>
          <Text
            style={{ color: colors.primary, fontSize: tokens.typography.fontSize.sm }}
            onPress={(event) => {
              event.stopPropagation();
              onPressPrivacyPolicy();
            }}
          >
            《隐私政策》
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 20,
  },
  checkboxTouchArea: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexShrink: 1,
  },
});
