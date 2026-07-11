import { Box, Text, VStack } from 'design-system-native';
import { StyleSheet } from 'react-native';
import { getVersion } from 'react-native-device-info';

import { SettingsListItem } from '@/components/setting/SettingsListItem';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MeScreenProps } from '@/navigation/types';
import { AboutSummarySection } from '@/sections/me/AboutSummarySection';

type AboutPageProps = MeScreenProps<'About'>;

export const AboutPage = ({ navigation }: AboutPageProps) => {
  const { colors } = useAppTheme();
  const appVersion = getVersion();

  return (
    <Box style={{ flex: 1, backgroundColor: colors.backgroundElevated }}>
      <AboutSummarySection appVersion={`版本号 ${appVersion}`} />

      <VStack style={styles.legalSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>法律条款</Text>
        <Box style={[styles.listCard, { backgroundColor: colors.background }]}>
          <SettingsListItem
            icon={<Text>📄</Text>}
            title="用户协议"
            onPress={() => {
              navigation.navigate(ROUTES.ME.USER_SERVICE_AGREEMENT);
            }}
          />
          <SettingsListItem
            icon={<Text>🔒</Text>}
            title="隐私政策"
            isLast
            onPress={() => {
              navigation.navigate(ROUTES.ME.PRIVACY_POLICY);
            }}
          />
        </Box>
      </VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  legalSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
});
