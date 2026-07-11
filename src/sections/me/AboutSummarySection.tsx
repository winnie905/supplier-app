import { Image, Text } from 'design-system-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authLoginLogoImage } from '@/components/images';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';

interface AboutSummarySectionProps {
  appVersion: string;
}

export const AboutSummarySection = ({ appVersion }: AboutSummarySectionProps) => {
  const { colors, tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === 'android' ? getAndroidGestureBottomInset(insets.bottom) : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={styles.summaryContent}>
        <Image source={authLoginLogoImage} style={styles.logo} />

        <Text
          style={[
            styles.versionText,
            {
              color: colors.text,
              fontSize: tokens.typography.fontSize.lg,
            },
          ]}
        >
          {appVersion}
        </Text>
      </View>

      <Text
        style={[
          styles.copyrightText,
          {
            bottom: bottomInset,
            fontSize: tokens.typography.fontSize.md,
          },
        ]}
      >
        {'Copyright © 2025 All rights reserved.\n粤ICP备2025408736号-1'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },

  summaryContent: {
    alignItems: 'center',
    marginTop: 36,
  },

  logo: {
    width: 114,
    height: 114,
    borderRadius: 12,
  },

  versionText: {
    marginTop: 16,
    lineHeight: 28,
    textAlign: 'center',
  },

  copyrightText: {
    position: 'absolute',
    left: 16,
    right: 16,
    color: '#A4B2C7',
    lineHeight: 24,
    textAlign: 'center',
  },
});
