import { Text, VStack } from 'design-system-native';
import { Image, StyleSheet, View } from 'react-native';

import { authLoginLogoImage } from '@/components/images';
import { AUTH_STRINGS } from '@/constants/legalContent';
import { LOGIN_THEME } from '@/constants/loginTheme';
import { useAppTheme } from '@/hooks/useAppTheme';

export const LoginHeroSection = () => {
  const { tokens } = useAppTheme();

  return (
    <View style={styles.header}>
      <VStack style={{ gap: tokens.spacing.xs, flex: 1 }}>
        <Text style={styles.hello}>{AUTH_STRINGS.helloTitle}</Text>
        <Text style={styles.subtitle}>{AUTH_STRINGS.helloSubtitle}</Text>
      </VStack>

      <View style={styles.logoCircle}>
        <Image resizeMode="contain" source={authLoginLogoImage} style={styles.logo} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  hello: {
    color: LOGIN_THEME.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  subtitle: {
    color: LOGIN_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LOGIN_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...LOGIN_THEME.cardShadow,
  },
  logo: {
    width: 40,
    height: 40,
  },
});
