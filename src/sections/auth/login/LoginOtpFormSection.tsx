import { Button, Text, VStack } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

import { ClearableInput } from '@/components/ClearableInput';
import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { PhoneNumberField } from '@/components/PhoneNumberField';
import { useAppTheme } from '@/hooks/useAppTheme';

export type LoginMode = 'phone' | 'email';

interface LoginOtpFormSectionProps {
  account: string;
  accountError: string;
  canRequestCode: boolean;
  isPhoneMode: boolean;
  isSendingCode: boolean;
  onAccountChange: (value: string) => void;
  onAccountBlur: () => void;
  onRequestCode: () => void;
  placeholder: string;
  requestCodeLabel: string;
  country: PhoneCountryCode;
  onCountryChange: (country: PhoneCountryCode) => void;
}
export const LoginOtpFormSection = ({
  account,
  accountError,
  canRequestCode,
  isPhoneMode,
  isSendingCode,
  onAccountChange,
  onAccountBlur,
  onRequestCode,
  placeholder,
  requestCodeLabel,
  country,
  onCountryChange,
}: LoginOtpFormSectionProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      <VStack style={{ gap: 0 }}>
        {isPhoneMode ? (
          <PhoneNumberField
            country={country}
            value={account}
            placeholder={placeholder}
            disabled={isSendingCode}
            onBlur={onAccountBlur}
            onCountryChange={onCountryChange}
            onChange={onAccountChange}
            style={styles.input}
          />
        ) : (
          <ClearableInput
            value={account}
            onBlur={onAccountBlur}
            onChangeText={onAccountChange}
            placeholder={placeholder}
            placeholderTextColor="#C8D4E5"
            disabled={isSendingCode}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="done"
            textContentType="emailAddress"
            style={styles.input}
            inputFieldStyle={styles.inputField}
          />
        )}

        {accountError ? (
          <Text
            style={{
              color: colors.error,
              fontSize: tokens.typography.fontSize.sm,
              marginTop: -8,
            }}
          >
            {accountError}
          </Text>
        ) : null}
      </VStack>

      <Button
        isDisabled={!canRequestCode}
        loading={isSendingCode}
        onPress={onRequestCode}
        textStyle={styles.otpButtonText}
        style={[styles.otpButton, !canRequestCode && styles.otpButtonDisabled]}
      >
        {requestCodeLabel}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 52,
    marginBottom: 15,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F5F8FD',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
  },
  inputField: {
    color: '#1F2937',
    fontSize: 16,
  },

  otpButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#1768D2',
    borderWidth: 0,
  },
  otpButtonDisabled: {
    opacity: 1,
    backgroundColor: 'rgba(23, 104, 210, 0.3)',
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
