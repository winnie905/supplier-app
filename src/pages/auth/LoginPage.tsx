import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { getCallingCodeText, isValidPhoneNumberByCountry } from '@/components/PhoneNumberField';
import { useToast } from '@/components/toast/Toast';
import { ROUTES } from '@/constants/routes';
import { useTncConsent } from '@/hooks/tnc/useTncConsent';
import type { AuthScreenProps } from '@/navigation/types';
import { LoginAgreementSection } from '@/sections/auth/login/LoginAgreementSection';
import { LoginHeroSection } from '@/sections/auth/login/LoginHeroSection';
import { type LoginMode, LoginOtpFormSection } from '@/sections/auth/login/LoginOtpFormSection';
import { LoginShell } from '@/sections/auth/login/LoginShell';
import { TncConsentModal } from '@/sections/tnc/TncConsentModal';
import { useAuthStore } from '@/store/authStore';
import {
  loadRememberedEmailLoginAccount,
  loadRememberedPhoneLoginAccount,
  saveRememberedEmailLoginAccount,
  saveRememberedPhoneLoginAccount,
} from '@/utils/auth/credentialStorage';
import { getErrorMessage, isValidEmailFormat } from '@/utils/form';

const CODE_COUNTDOWN_SECONDS = 60;

const buildPendingUserId = (account: string) => `mock-user:${account.trim().toLowerCase()}`;

type LoginPageProps = AuthScreenProps<'Login'>;

export const LoginPage = ({ navigation }: LoginPageProps) => {
  const { showToast } = useToast();
  const signIn = useAuthStore((state) => state.signIn);

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryCode>('CN');
  const [countdown, setCountdown] = useState(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPhoneMode = loginMode === 'phone';
  const account = isPhoneMode ? phone : email;
  const trimmedAccount = account.trim();
  const trimmedCode = verificationCode.trim();
  const loginAccount = useMemo(() => {
    if (!trimmedAccount) {
      return '';
    }

    if (isPhoneMode) {
      return trimmedAccount.replace(getCallingCodeText(phoneCountry), '');
    }

    return trimmedAccount;
  }, [isPhoneMode, phoneCountry, trimmedAccount]);
  const pendingUserId = loginAccount ? buildPendingUserId(loginAccount) : null;

  const {
    confirmConsent,
    isSubmitting: isPersistingConsent,
    refresh,
  } = useTncConsent({
    userId: pendingUserId,
    enabled: !!pendingUserId,
  });

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

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps -- restart timer when countdown begins

  const isAccountFormatValid = useMemo(() => {
    if (!trimmedAccount) {
      return false;
    }

    if (isPhoneMode) {
      return isValidPhoneNumberByCountry(trimmedAccount, phoneCountry);
    }

    return isValidEmailFormat(trimmedAccount);
  }, [isPhoneMode, phoneCountry, trimmedAccount]);

  const canGetCode = isAccountFormatValid && countdown === 0 && !isSigningIn;

  const canLogin = useMemo(() => {
    return isAccountFormatValid && !!trimmedCode && !isSigningIn;
  }, [isAccountFormatValid, isSigningIn, trimmedCode]);

  const validateAccountFormat = () => {
    if (!trimmedAccount) {
      return isPhoneMode ? '请输入正确的手机号' : '邮箱格式错误';
    }

    if (isPhoneMode && !isValidPhoneNumberByCountry(trimmedAccount, phoneCountry)) {
      return '请输入正确的手机号';
    }

    if (!isPhoneMode && !isValidEmailFormat(trimmedAccount)) {
      return '邮箱格式错误';
    }

    return '';
  };

  const handleAccountBlur = () => {
    if (!trimmedAccount) {
      setAccountError('');
      return;
    }

    setAccountError(validateAccountFormat());
  };

  const handleAccountChange = (value: string) => {
    if (isPhoneMode) {
      setPhone(value);
    } else {
      setEmail(value);
    }

    setAccountError('');
  };

  const handleVerificationCodeChange = (value: string) => {
    setVerificationCode(value.replace(/\D/g, ''));
    setCodeError('');
  };

  const handleVerificationCodeBlur = () => {
    if (!trimmedCode) {
      setCodeError('');
    }
  };

  const handleLoginModeChange = (mode: LoginMode) => {
    setAccountError('');
    setCodeError('');
    setLoginMode(mode);
  };

  const handleGetCode = () => {
    const formatError = validateAccountFormat();

    if (formatError) {
      setAccountError(formatError);
      return;
    }

    setCountdown(CODE_COUNTDOWN_SECONDS);
    showToast('验证码已发送（mock）');
  };

  const performLogin = async () => {
    setIsSigningIn(true);
    setAccountError('');
    setCodeError('');

    try {
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
      Alert.alert('提示', getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogin = () => {
    const formatError = validateAccountFormat();

    if (formatError) {
      setAccountError(formatError);
      return;
    }

    if (!trimmedCode) {
      setCodeError('请输入验证码');
      return;
    }

    // 每次登录都弹出协议确认；是否落库由 tncService.confirmLoginConsent 判断
    void refresh();
    setAgreementModalOpen(true);
  };

  const handleConsentAgree = async () => {
    const ok = await confirmConsent();
    if (!ok) {
      Alert.alert('提示', '协议同意提交失败，请稍后重试');
      return;
    }

    setAgreementModalOpen(false);
    setAgreed(true);
    InteractionManager.runAfterInteractions(() => {
      void performLogin();
    });
  };

  const openPrivacyPolicy = () => {
    navigation.navigate(ROUTES.AUTH.PRIVACY_POLICY);
  };

  const openUserServiceAgreement = () => {
    navigation.navigate(ROUTES.AUTH.USER_SERVICE_AGREEMENT);
  };

  return (
    <LoginShell>
      <View style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={styles.flex}
        >
          <View style={styles.main}>
            <LoginHeroSection />

            <View>
              <LoginOtpFormSection
                loginMode={loginMode}
                onLoginModeChange={handleLoginModeChange}
                account={account}
                accountError={accountError}
                verificationCode={verificationCode}
                codeError={codeError}
                canLogin={canLogin}
                canGetCode={canGetCode}
                countdown={countdown}
                isPhoneMode={isPhoneMode}
                isSigningIn={isSigningIn}
                onAccountChange={handleAccountChange}
                onAccountBlur={handleAccountBlur}
                onVerificationCodeChange={handleVerificationCodeChange}
                onVerificationCodeBlur={handleVerificationCodeBlur}
                onGetCode={handleGetCode}
                onLogin={handleLogin}
                country={phoneCountry}
                onCountryChange={setPhoneCountry}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        <LoginAgreementSection
          agreed={agreed}
          onChange={setAgreed}
          onPressPrivacyPolicy={openPrivacyPolicy}
          onPressUserServiceAgreement={openUserServiceAgreement}
          style={styles.agreementSection}
        />
      </View>

      <TncConsentModal
        open={agreementModalOpen}
        isSubmitting={isPersistingConsent || isSigningIn}
        onPressPrivacyPolicy={openPrivacyPolicy}
        onPressUserServiceAgreement={openUserServiceAgreement}
        onAgree={() => {
          void handleConsentAgree();
        }}
        onDisagree={() => {
          setAgreementModalOpen(false);
        }}
      />
    </LoginShell>
  );
};

const CARD_TOP_OFFSET = 205;
const HERO_BLOCK_HEIGHT = 30 + 19 + 24 + 46;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingBottom: 96,
    paddingHorizontal: 20,
    paddingTop: CARD_TOP_OFFSET - HERO_BLOCK_HEIGHT,
  },
  agreementSection: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
