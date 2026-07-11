import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Box, Text } from 'design-system-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { useTncVersions } from '@/hooks/tnc/useTncVersions';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthStackParamList, MeStackParamList } from '@/navigation/types';
import { TncHtmlContent } from '@/sections/tnc/TncHtmlContent';

type PrivacyPolicyPageProps = NativeStackScreenProps<
  AuthStackParamList | MeStackParamList,
  'PrivacyPolicy'
>;

/**
 * 隐私政策全文（后端 HTML 富文本）。
 * 清单页入口保留，供后续在富文本中通过链接扩展；当前 mock HTML 自含表格说明。
 */
export const PrivacyPolicyPage = ({ navigation }: PrivacyPolicyPageProps) => {
  const { colors } = useAppTheme();
  const { privacyPolicy } = useTncVersions();

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {privacyPolicy?.content ? <TncHtmlContent html={privacyPolicy.content} /> : null}

        <ViewLinks
          onPressPersonalInfoCollectionList={() => {
            navigation.navigate('PersonalInfoCollectionList');
          }}
          onPressSdkShareList={() => {
            navigation.navigate('SdkShareList');
          }}
        />
      </ScrollView>
    </Box>
  );
};

const ViewLinks = ({
  onPressPersonalInfoCollectionList,
  onPressSdkShareList,
}: {
  onPressPersonalInfoCollectionList: () => void;
  onPressSdkShareList: () => void;
}) => {
  const { colors } = useAppTheme();

  return (
    <Box style={styles.linksBlock}>
      <Pressable onPress={onPressPersonalInfoCollectionList}>
        <Text style={{ color: colors.primary, lineHeight: 28 }}>《个人信息收集清单》</Text>
      </Pressable>
      <Pressable onPress={onPressSdkShareList}>
        <Text style={{ color: colors.primary, lineHeight: 28 }}>
          《第三方共享个人信息（含 SDK）清单》
        </Text>
      </Pressable>
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
  linksBlock: {
    marginTop: 8,
    gap: 4,
  },
});
