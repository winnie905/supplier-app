import { Box } from 'design-system-native';
import { getVersion } from 'react-native-device-info';

import { ABOUT_STRINGS } from '@/constants/legalContent';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MeScreenProps } from '@/navigation/types';
import { AboutSummarySection } from '@/sections/me/AboutSummarySection';

type AboutPageProps = MeScreenProps<'About'>;

export const AboutPage = (_props: AboutPageProps) => {
  const { colors } = useAppTheme();
  const appVersion = getVersion();

  return (
    <Box style={{ flex: 1, backgroundColor: colors.backgroundElevated }}>
      <AboutSummarySection appVersion={`${ABOUT_STRINGS.version} ${appVersion}`} />
    </Box>
  );
};
