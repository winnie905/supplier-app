import { Box } from 'design-system-native';
import { getVersion } from 'react-native-device-info';

import { useAppTheme } from '@/hooks/useAppTheme';
import { AboutSummarySection } from '@/sections/me/AboutSummarySection';

export const AboutPage = () => {
  const { colors } = useAppTheme();
  const appVersion = getVersion();

  return (
    <Box style={{ flex: 1, backgroundColor: colors.backgroundElevated }}>
      <AboutSummarySection appVersion={`版本号 ${appVersion}`} />
    </Box>
  );
};
