import { getCountryCallingCode } from 'libphonenumber-js/min';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { AppModal } from '@/components/AppModal';
import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { getCallingCodeText, isValidPhoneNumberByCountry } from '@/components/PhoneNumberField';
import { useToast } from '@/components/toast/Toast';
import { DEFAULT_SESSION_KICKED_OFFLINE_MESSAGE } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { useTncConsent } from '@/hooks/tnc/useTncConsent';
import type { AuthScreenProps } from '@/navigation/types';
import { LoginAgreementSection } from '@/sections/auth/login/LoginAgreementSection';
import { LoginHeroSection } from '@/sections/auth/login/LoginHeroSection';
import { type LoginMode, LoginOtpFormSection } from '@/sections/auth/login/LoginOtpFormSection';
import { LoginShell } from '@/sections/auth/login/LoginShell';
import { TncConsentModal } from '@/sections/tnc/TncConsentModal';
import { useLogin } from '@/services/auth/hooks/useLogin';
import { useAuthStore } from '@/store/authStore';
import {
  loadRememberedEmailLoginAccount,
  loadRememberedPhoneLoginAccount,
  saveRememberedEmailLoginAccount,
  saveRememberedPhoneLoginAccount,
} from '@/utils/auth/credentialStorage';
import { getErrorMessage, isValidEmailFormat } from '@/utils/form';

const CODE_COUNTDOWN_SECONDS = 60;

const buildPendingUserId = (account: string) => `pending-user:${account.trim().toLowerCase()}`;

type LoginPageProps = AuthScreenProps<'Login'>;

export const LoginPage = ({ navigation }: LoginPageProps) => {
  const { showToast } = useToast();
  const { loginByOtp, sendOtpCode, loading: isAuthLoading } = useLogin();
  const sessionExpiredMessage = useAuthStore((state) => state.sessionExpiredMessage);
  const consumeSessionExpiredMessage = useAuthStore((state) => state.consumeSessionExpiredMessage);

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [sessionExpiredModalVisible, setSessionExpiredModalVisible] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryCode>('CN');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const emailCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPhoneMode = loginMode === 'phone';
  const countdown = isPhoneMode ? phoneCountdown : emailCountdown;
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
  const areaCode = useMemo(
    () => (isPhoneMode ? getCountryCallingCode(phoneCountry) : undefined),
    [isPhoneMode, phoneCountry],
  );
  const pendingUserId = loginAccount ? buildPendingUserId(loginAccount) : null;
  const busy = isSendingCode || isSigningIn || isAuthLoading;

  const {
    confirmConsent,
    isSubmitting: isPersistingConsent,
    refresh,
  } = useTncConsent({
    userId: pendingUserId,
    enabled: !!pendingUserId,
  });

  useEffect(() => {
    if (!sessionExpiredMessage) {
      return;
    }
    setSessionExpiredModalVisible(true);
  }, [sessionExpiredMessage]);

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
    if (emailCountdown <= 0) {
      return;
    }

    emailCountdownTimerRef.current = setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev <= 1) {
          if (emailCountdownTimerRef.current) {
            clearInterval(emailCountdownTimerRef.current);
            emailCountdownTimerRef.current = null;
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (emailCountdownTimerRef.current) {
        clearInterval(emailCountdownTimerRef.current);
        emailCountdownTimerRef.current = null;
      }
    };
  }, [emailCountdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps -- restart timer when countdown begins

  useEffect(() => {
    if (phoneCountdown <= 0) {
      return;
    }

    phoneCountdownTimerRef.current = setInterval(() => {
      setPhoneCountdown((prev) => {
        if (prev <= 1) {
          if (phoneCountdownTimerRef.current) {
            clearInterval(phoneCountdownTimerRef.current);
            phoneCountdownTimerRef.current = null;
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (phoneCountdownTimerRef.current) {
        clearInterval(phoneCountdownTimerRef.current);
        phoneCountdownTimerRef.current = null;
      }
    };
  }, [phoneCountdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps -- restart timer when countdown begins

  const isAccountFormatValid = useMemo(() => {
    if (!trimmedAccount) {
      return false;
    }

    if (isPhoneMode) {
      return isValidPhoneNumberByCountry(trimmedAccount, phoneCountry);
    }

    return isValidEmailFormat(trimmedAccount);
  }, [isPhoneMode, phoneCountry, trimmedAccount]);

  const canGetCode = isAccountFormatValid && countdown === 0 && !busy;

  const canLogin = useMemo(() => {
    return isAccountFormatValid && !!trimmedCode && !busy;
  }, [busy, isAccountFormatValid, trimmedCode]);

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

  const handleGetCode = async () => {
    const formatError = validateAccountFormat();

    if (formatError) {
      setAccountError(formatError);
      return;
    }

    setIsSendingCode(true);
    setAccountError('');

    try {
      const sendOtp = await sendOtpCode({
        [isPhoneMode ? 'mobile' : 'email']: loginAccount,
        areaCode,
      });

      // sendOtp === '' 表示账号不存在时也按发送成功处理，与 apex / PC 端一致
      if (sendOtp === '' || sendOtp) {
        if (isPhoneMode) {
          setPhoneCountdown(CODE_COUNTDOWN_SECONDS);
        } else {
          setEmailCountdown(CODE_COUNTDOWN_SECONDS);
        }
        showToast('验证码已发送');
      } else {
        Alert.alert('提示', '验证码发送失败，请稍后重试');
      }
    } catch (error) {
      Alert.alert('提示', getErrorMessage(error));
    } finally {
      setIsSendingCode(false);
    }
  };

  const rememberLoginAccountSafely = async () => {
    try {
      if (isPhoneMode) {
        await saveRememberedPhoneLoginAccount({
          phoneNumber: loginAccount,
          countryCode: phoneCountry,
        });
        return;
      }
      await saveRememberedEmailLoginAccount({ email: loginAccount });
    } catch (error) {
      console.warn('[LoginPage] Failed to save remembered login account:', error);
    }
  };

  const performLogin = async () => {
    setIsSigningIn(true);
    setAccountError('');
    setCodeError('');

    try {
      await loginByOtp({
        otp: trimmedCode,
        [isPhoneMode ? 'mobile' : 'email']: loginAccount,
        areaCode,
      });
      void rememberLoginAccountSafely();
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

  const handleSessionExpiredModalClose = () => {
    setSessionExpiredModalVisible(false);
    consumeSessionExpiredMessage();
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
                isSigningIn={busy}
                onAccountChange={handleAccountChange}
                onAccountBlur={handleAccountBlur}
                onVerificationCodeChange={handleVerificationCodeChange}
                onVerificationCodeBlur={handleVerificationCodeBlur}
                onGetCode={() => {
                  void handleGetCode();
                }}
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

      <AppModal
        closeOnBackdropPress={false}
        content={sessionExpiredMessage ?? DEFAULT_SESSION_KICKED_OFFLINE_MESSAGE}
        okText="我知道了"
        onClose={handleSessionExpiredModalClose}
        onOk={handleSessionExpiredModalClose}
        title="登录提示"
        visible={sessionExpiredModalVisible && Boolean(sessionExpiredMessage)}
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
