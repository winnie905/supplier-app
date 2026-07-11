import { Box } from 'design-system-native';
import { ScrollView, StyleSheet } from 'react-native';

import { useTncVersions } from '@/hooks/tnc/useTncVersions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TncHtmlContent } from '@/sections/tnc/TncHtmlContent';

/**
 * 用户服务协议全文（后端 HTML 富文本）。
 */
export const UserServiceAgreementPage = () => {
  const { colors } = useAppTheme();
  const { userAgreement } = useTncVersions();

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {userAgreement?.content ? <TncHtmlContent html={userAgreement.content} /> : null}
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
