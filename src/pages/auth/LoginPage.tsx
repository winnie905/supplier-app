import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ServiceAgreementModal } from '@/components/auth/ServiceAgreementModal';
import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { getCallingCodeText, isValidPhoneNumberByCountry } from '@/components/PhoneNumberField';
import { AUTH_STRINGS, COMMON_STRINGS } from '@/constants/legalContent';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';
import { LoginAgreementSection } from '@/sections/auth/login/LoginAgreementSection';
import { LoginHeroSection } from '@/sections/auth/login/LoginHeroSection';
import { type LoginMode, LoginOtpFormSection } from '@/sections/auth/login/LoginOtpFormSection';
import { LoginShell } from '@/sections/auth/login/LoginShell';
import { useAuthStore } from '@/store/authStore';
import {
  loadRememberedEmailLoginAccount,
  loadRememberedPhoneLoginAccount,
  saveRememberedEmailLoginAccount,
  saveRememberedPhoneLoginAccount,
} from '@/utils/auth/credentialStorage';
import { getErrorMessage, isValidEmailFormat } from '@/utils/form';

type LoginPageProps = AuthScreenProps<'Login'>;

export const LoginPage = ({ navigation }: LoginPageProps) => {
  const { tokens } = useAppTheme();
  const signIn = useAuthStore((state) => state.signIn);

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryCode>('CN');

  useEffect(() => {
    const hydrate = async () => {
      if (loginMode === 'email') {
        const saved = await loadRememberedEmailLoginAccount();
        if (!saved || email) {
          return;
        }
        setEmail(saved.email);
        return;
      }
      const saved = await loadRememberedPhoneLoginAccount();
      if (!saved || phone) {
        return;
      }
      setPhone(saved.phoneNumber ?? '');
      setPhoneCountry(saved.countryCode ?? 'CN');
    };
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per loginMode when field is empty
  }, [loginMode]);

  const isPhoneMode = loginMode === 'phone';
  const account = isPhoneMode ? phone : email;
  const trimmedAccount = account.trim();

  const canLogin = useMemo(() => {
    return !!trimmedAccount && !fieldError && !isSigningIn;
  }, [fieldError, isSigningIn, trimmedAccount]);

  const currentConfig = useMemo(() => {
    if (isPhoneMode) {
      return {
        placeholder: AUTH_STRINGS.phonePlaceholder,
        requestCodeLabel: '登录',
        moreLoginLabel: AUTH_STRINGS.emailCodeLogin,
      };
    }

    return {
      placeholder: AUTH_STRINGS.emailPlaceholder,
      requestCodeLabel: '登录',
      moreLoginLabel: AUTH_STRINGS.phoneCodeLogin,
    };
  }, [isPhoneMode]);

  const validateAccountFormat = () => {
    if (!trimmedAccount) {
      return '';
    }

    if (isPhoneMode && !isValidPhoneNumberByCountry(trimmedAccount, phoneCountry)) {
      return AUTH_STRINGS.phoneFormatError;
    }

    if (!isPhoneMode && !isValidEmailFormat(trimmedAccount)) {
      return AUTH_STRINGS.emailFormatError;
    }

    return '';
  };

  const handleAccountBlur = () => {
    setFieldError(validateAccountFormat());
  };

  const handleAccountChange = (value: string) => {
    if (isPhoneMode) {
      setPhone(value);
    } else {
      setEmail(value);
    }

    setFieldError('');
  };

  const handleCountryChange = (nextCountry: PhoneCountryCode) => {
    setPhoneCountry(nextCountry);
    setFieldError('');
  };

  const handleSwitchMode = () => {
    setFieldError('');
    setLoginMode((prev) => (prev === 'phone' ? 'email' : 'phone'));
  };

  const performLogin = async () => {
    setIsSigningIn(true);
    setFieldError('');

    try {
      const loginAccount = isPhoneMode
        ? trimmedAccount.replace(getCallingCodeText(phoneCountry), '')
        : trimmedAccount;

      await signIn(loginAccount);

      if (isPhoneMode) {
        await saveRememberedPhoneLoginAccount({
          phoneNumber: loginAccount,
          countryCode: phoneCountry,
        });
      } else {
        await saveRememberedEmailLoginAccount({ email: loginAccount });
      }
    } catch (error) {
      Alert.alert(COMMON_STRINGS.alertTitle, getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogin = () => {
    const formatError = validateAccountFormat();

    if (formatError) {
      setFieldError(formatError);
      return;
    }

    if (!agreed) {
      setAgreementModalOpen(true);
      return;
    }

    void performLogin();
  };

  return (
    <LoginShell>
      <View style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: tokens.spacing.xl,
                paddingTop: tokens.spacing.lg,
                paddingBottom: 96,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: tokens.spacing.lg, flex: 1 }}>
              <LoginHeroSection
                modeSwitchLabel={currentConfig.moreLoginLabel}
                onModeSwitch={handleSwitchMode}
              />

              <LoginOtpFormSection
                account={account}
                accountError={fieldError}
                canRequestCode={canLogin}
                isPhoneMode={isPhoneMode}
                isSendingCode={isSigningIn}
                onAccountChange={handleAccountChange}
                onAccountBlur={handleAccountBlur}
                onRequestCode={handleLogin}
                placeholder={currentConfig.placeholder}
                requestCodeLabel={currentConfig.requestCodeLabel}
                country={phoneCountry}
                onCountryChange={handleCountryChange}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <LoginAgreementSection
          agreed={agreed}
          onChange={setAgreed}
          onPressPrivacyPolicy={() => {
            navigation.navigate(ROUTES.AUTH.PRIVACY_POLICY);
          }}
          onPressUserServiceAgreement={() => {
            navigation.navigate(ROUTES.AUTH.USER_SERVICE_AGREEMENT);
          }}
          style={styles.agreementSection}
        />
      </View>
      <ServiceAgreementModal
        onPressPrivacyPolicy={() => {
          navigation.navigate(ROUTES.AUTH.PRIVACY_POLICY);
        }}
        onPressUserServiceAgreement={() => {
          navigation.navigate(ROUTES.AUTH.USER_SERVICE_AGREEMENT);
        }}
        onAgree={() => {
          setAgreementModalOpen(false);
          setAgreed(true);
          void performLogin();
        }}
        onDisagree={() => {
          setAgreementModalOpen(false);
        }}
        open={agreementModalOpen}
        title={AUTH_STRINGS.agreementModalTitle}
      />
    </LoginShell>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  agreementSection: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
