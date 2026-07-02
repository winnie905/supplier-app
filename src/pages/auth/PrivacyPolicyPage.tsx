import { Box } from 'design-system-native';
import { ScrollView, StyleSheet } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';
import { PrivacyPolicy } from '@/sections/auth/tnc/PrivacyPolicy';

type PrivacyPolicyPageProps = AuthScreenProps<'PrivacyPolicy'>;

/**
 * 隐私政策全文。
 */
export const PrivacyPolicyPage = ({ navigation }: PrivacyPolicyPageProps) => {
  const { colors } = useAppTheme();

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <PrivacyPolicy
          onPressPersonalInfoCollectionList={() => {
            navigation.navigate(ROUTES.AUTH.PERSONAL_INFO_COLLECTION_LIST);
          }}
          onPressSdkShareList={() => {
            navigation.navigate(ROUTES.AUTH.SDK_SHARE_LIST);
          }}
        />
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
