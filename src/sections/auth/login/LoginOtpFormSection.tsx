import { Pressable, Text, VStack } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

import ReverseCornerSvg from '@/assets/icons/reverseCorner.svg';
import { ClearableInput } from '@/components/ClearableInput';
import { FlatButton } from '@/components/FlatButton';
import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { PhoneNumberField } from '@/components/PhoneNumberField';
import { useAppTheme } from '@/hooks/useAppTheme';

export type LoginMode = 'phone' | 'email';

interface LoginOtpFormSectionProps {
  loginMode: LoginMode;
  onLoginModeChange: (mode: LoginMode) => void;
  account: string;
  accountError: string;
  verificationCode: string;
  codeError: string;
  canLogin: boolean;
  canGetCode: boolean;
  countdown: number;
  isPhoneMode: boolean;
  isSigningIn: boolean;
  onAccountChange: (value: string) => void;
  onAccountBlur: () => void;
  onVerificationCodeChange: (value: string) => void;
  onVerificationCodeBlur: () => void;
  onGetCode: () => void;
  onLogin: () => void;
  country: PhoneCountryCode;
  onCountryChange: (country: PhoneCountryCode) => void;
}

const RADIUS = 18;
const INPUT_RADIUS = 8;
const TAB_HEIGHT = 48;

function LoginTabs({ value, onChange }: { value: LoginMode; onChange: (mode: LoginMode) => void }) {
  const isEmailActive = value === 'email';
  const activeSide = isEmailActive ? styles.tabSideLeft : styles.tabSideRight;
  const inactiveSide = isEmailActive ? styles.tabSideRight : styles.tabSideLeft;

  return (
    <View style={styles.tabBar}>
      <View pointerEvents="none" style={[styles.tabInactiveBg, activeSide]} />
      <View
        pointerEvents="none"
        style={[
          styles.tabInactiveBg,
          inactiveSide,
          isEmailActive ? styles.tabInactiveRight : styles.tabInactiveLeft,
        ]}
      />
      {isEmailActive ? (
        <View pointerEvents="none" style={styles.tabCornerPatchRight}>
          <ReverseCornerSvg width={RADIUS} height={RADIUS} />
        </View>
      ) : (
        <View pointerEvents="none" style={styles.tabCornerPatchLeft}>
          <ReverseCornerSvg width={RADIUS} height={RADIUS} style={styles.tabCornerMirror} />
        </View>
      )}
      <View pointerEvents="none" style={[styles.tabActiveBg, activeSide]} />

      {(['email', 'phone'] as const).map((mode, index) => {
        const active = value === mode;
        return (
          <Pressable
            key={mode}
            style={[styles.tabPressable, index === 0 ? styles.tabSideLeft : styles.tabSideRight]}
            onPress={() => onChange(mode)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {mode === 'email' ? '邮箱验证码登录' : '手机验证码登录'}
            </Text>
            {active ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const LoginOtpFormSection = ({
  loginMode,
  onLoginModeChange,
  account,
  accountError,
  verificationCode,
  codeError,
  canLogin,
  canGetCode,
  countdown,
  isPhoneMode,
  isSigningIn,
  onAccountChange,
  onAccountBlur,
  onVerificationCodeChange,
  onVerificationCodeBlur,
  onGetCode,
  onLogin,
  country,
  onCountryChange,
}: LoginOtpFormSectionProps) => {
  const { colors } = useAppTheme();

  const getCodeLabel =
    countdown > 0 ? `${countdown}s` : verificationCode ? '重新获取' : '获取验证码';

  const getCodeDisabled = !canGetCode || countdown > 0 || isSigningIn;

  return (
    <View style={styles.card}>
      <LoginTabs value={loginMode} onChange={onLoginModeChange} />

      <VStack style={styles.body}>
        <VStack style={styles.fields}>
          <View>
            <Text style={styles.label}>{isPhoneMode ? '手机号' : '邮箱地址'}</Text>
            {isPhoneMode ? (
              <PhoneNumberField
                country={country}
                value={account}
                placeholder="请输入手机号"
                disabled={isSigningIn}
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
                placeholder="请输入邮箱地址"
                placeholderTextColor="#C8D4E5"
                disabled={isSigningIn}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                textContentType="emailAddress"
                style={styles.input}
                inputFieldStyle={styles.inputText}
              />
            )}
            {accountError ? (
              <Text style={[styles.error, { color: colors.error }]}>{accountError}</Text>
            ) : null}
          </View>

          <View>
            <Text style={styles.label}>验证码</Text>
            <View style={styles.codeRow}>
              <ClearableInput
                value={verificationCode}
                onBlur={onVerificationCodeBlur}
                onChangeText={onVerificationCodeChange}
                placeholder="请输入验证码"
                placeholderTextColor="#C8D4E5"
                disabled={isSigningIn}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={6}
                showClearButton={true}
                style={styles.codeInput}
                inputFieldStyle={styles.inputText}
              />
              <View style={styles.codeDivider} />
              <Pressable
                accessibilityRole="button"
                disabled={getCodeDisabled}
                onPress={onGetCode}
                style={styles.getCodeButton}
              >
                <Text style={[styles.getCodeText, getCodeDisabled && styles.getCodeTextDisabled]}>
                  {getCodeLabel}
                </Text>
              </Pressable>
            </View>
            {codeError ? (
              <Text style={[styles.error, { color: colors.error }]}>{codeError}</Text>
            ) : null}
          </View>
        </VStack>

        <FlatButton
          isDisabled={!canLogin}
          loading={isSigningIn}
          onPress={onLogin}
          textStyle={styles.loginButtonText}
          style={[styles.loginButton, !canLogin && styles.loginButtonDisabled]}
        >
          登录
        </FlatButton>
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 19,
    borderWidth: 0.6,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  body: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  fields: {
    gap: 24,
  },
  label: {
    color: '#6C829E',
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: INPUT_RADIUS,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 15,
  },
  inputText: {
    color: '#0E2D5B',
    fontSize: 15,
  },
  codeRow: {
    height: 48,
    borderRadius: INPUT_RADIUS,
    backgroundColor: '#F5F7FA',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  codeInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
  },
  codeDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D8E1EF',
  },
  getCodeButton: {
    height: '100%',
    minWidth: 96,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getCodeText: {
    color: '#105FC8',
    fontSize: 14,
    fontWeight: '600',
  },
  getCodeTextDisabled: {
    color: '#8A98AD',
  },
  error: {
    fontSize: 12,
    marginTop: 6,
  },
  loginButton: {
    height: 48,
    borderRadius: INPUT_RADIUS,
    backgroundColor: '#1768D2',
    marginTop: 40,
  },
  loginButtonDisabled: {
    backgroundColor: '#B8CDE9',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  tabBar: {
    height: TAB_HEIGHT,
    position: 'relative',
  },
  tabSideLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '50%',
  },
  tabSideRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%',
  },
  tabInactiveBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  tabInactiveRight: {
    zIndex: 2,
    borderTopRightRadius: RADIUS,
    borderBottomLeftRadius: RADIUS,
  },
  tabInactiveLeft: {
    zIndex: 2,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  tabCornerPatchRight: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: RADIUS,
    height: RADIUS,
    zIndex: 3,
  },
  tabCornerPatchLeft: {
    position: 'absolute',
    left: '50%',
    marginLeft: -RADIUS,
    bottom: 0,
    width: RADIUS,
    height: RADIUS,
    zIndex: 3,
  },
  tabCornerMirror: {
    transform: [{ scaleX: -1 }],
  },
  tabActiveBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    zIndex: 4,
  },
  tabPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0B2447',
    textAlign: 'center',
  },
  tabTextActive: {
    fontSize: 18,
    fontWeight: '600',
    color: '#061B37',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#105FC8',
  },
});
