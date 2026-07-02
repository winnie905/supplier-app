import { Box } from 'design-system-native';
import { ScrollView, StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';
import { ServiceAgreement } from '@/sections/auth/tnc/ServiceAgreement';

type UserServiceAgreementPageProps = AuthScreenProps<'UserServiceAgreement'>;

/**
 * 用户服务协议全文。
 */
export const UserServiceAgreementPage = (_props: UserServiceAgreementPageProps) => {
  const { colors } = useAppTheme();

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ServiceAgreement />
      </ScrollView>
    </Box>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
