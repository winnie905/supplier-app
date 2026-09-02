import { Box } from 'design-system-native';

import { APP_VERSION } from '@/constants/app';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AboutSummarySection } from '@/sections/me/AboutSummarySection';

export const AboutPage = () => {
  const { colors } = useAppTheme();

  return (
    <Box style={{ flex: 1, backgroundColor: colors.backgroundElevated }}>
      <AboutSummarySection appVersion={`版本号 ${APP_VERSION}`} />
    </Box>
  );
};
