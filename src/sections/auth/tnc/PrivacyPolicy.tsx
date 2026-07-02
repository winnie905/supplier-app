import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { LEGAL_PRIVACY_POLICY } from '@/constants/legalContent';
import { useAppTheme } from '@/hooks/useAppTheme';

const META_TEXT_COLOR = '#7A8AA0';

const splitStrongTag = (value: string): [string, string, string] => {
  const match = /^(.*)<strong>(.*)<\/strong>(.*)$/s.exec(value);

  if (!match) {
    return [value, '', ''];
  }

  return [match[1] ?? '', match[2] ?? '', match[3] ?? ''];
};

interface PolicyItem {
  key: string;
  title: string;
  content?: string;
  note?: string;
  usage?: string;
  promise?: string;
}

interface PolicySection {
  key: string;
  title: string;
  intro?: string;
  items: PolicyItem[];
  footer?: {
    title: string;
    content: string;
  };
}

interface PrivacyPolicyProps {
  onPressPersonalInfoCollectionList: () => void;
  onPressSdkShareList: () => void;
}

export const PrivacyPolicy = ({
  onPressPersonalInfoCollectionList,
  onPressSdkShareList,
}: PrivacyPolicyProps) => {
  const { colors } = useAppTheme();
  const policy = LEGAL_PRIVACY_POLICY;

  const themeStyles = useMemo(
    () => ({
      text: {
        color: colors.text,
      } as TextStyle,
      strong: {
        color: colors.text,
        fontWeight: '700',
      } as TextStyle,
    }),
    [colors.text],
  );

  const renderMeta = () => {
    return (
      <View style={styles.metaBlock}>
        {policy.metaList.map((item) => (
          <View key={item.key} style={styles.metaRow}>
            <Text style={styles.metaLabel}>{item.label}：</Text>
            <Text style={styles.metaValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderIntro = () => {
    const [beforeStrong, strongText, afterStrong] = splitStrongTag(policy.intro);

    return (
      <View style={styles.introBlock}>
        <Text style={[styles.paragraph, themeStyles.text]}>
          {beforeStrong}
          <Text style={themeStyles.strong}>{strongText}</Text>
          {afterStrong}
        </Text>
      </View>
    );
  };

  const renderCollectionItem = (item: PolicyItem) => {
    return (
      <View key={item.key} style={styles.itemBlock}>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, themeStyles.text]}>•</Text>
          <Text style={[styles.itemText, themeStyles.text]}>
            <Text style={themeStyles.strong}>{item.title}：</Text>
            {item.key === 'thirdPartySdk' ? (
              <Text>
                为实现扫码解析、崩溃日志收集等基础技术功能，本软件接入了第三方 SDK。我们会对其进行严格的安全监测。详细名录请见
                <Text
                  style={{ color: colors.primary }}
                  onPress={(event) => {
                    event.stopPropagation();
                    onPressSdkShareList();
                  }}
                >
                  《第三方共享个人信息（含 SDK）清单》
                </Text>
                。
              </Text>
            ) : (
              <Text>{item.content}</Text>
            )}
          </Text>
        </View>

        {item.note ? (
          <Text style={[styles.noteText, themeStyles.text]}>
            {policy.commonLabels.note}：{item.note}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderPermissionItem = (item: PolicyItem) => {
    return (
      <View key={item.key} style={styles.itemBlock}>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, themeStyles.text]}>•</Text>
          <View style={styles.permissionContent}>
            <Text style={[styles.permissionTitle, themeStyles.strong]}>{item.title}</Text>

            <Text style={[styles.subParagraph, themeStyles.text]}>
              <Text style={themeStyles.text}>{policy.commonLabels.usage}：</Text>
              {item.usage}
            </Text>

            <Text style={[styles.subParagraph, themeStyles.text]}>
              <Text style={themeStyles.text}>{policy.commonLabels.promise}：</Text>
              {item.promise}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSection = (section: PolicySection) => {
    const isPermissionSection = section.key === 'permissions';

    return (
      <View key={section.key} style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, themeStyles.strong]}>{section.title}</Text>

        {section.key === 'collection' ? (
          <Text style={[styles.paragraph, themeStyles.text]}>
            为了实现本软件的内部业务功能，我们会遵循&quot;合法、正当、必要&quot;的原则，在您自愿选择服务或提供信息的情况下收集如下信息（快速查阅见
            <Text
              style={{ color: colors.primary }}
              onPress={(event) => {
                event.stopPropagation();
                onPressPersonalInfoCollectionList();
              }}
            >
              《个人信息收集清单》
            </Text>
            ）：
          </Text>
        ) : (
          <Text style={[styles.paragraph, themeStyles.text]}>{section.intro}</Text>
        )}

        {section.items.map((item) =>
          isPermissionSection ? renderPermissionItem(item) : renderCollectionItem(item),
        )}

        {section.footer ? (
          <View>
            <Text style={[styles.footerTitle, themeStyles.strong]}>{section.footer.title}</Text>
            <Text style={[styles.paragraph, themeStyles.text]}>{section.footer.content}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View>
      {renderMeta()}
      {renderIntro()}
      {policy.sections.map((section) => renderSection(section as unknown as PolicySection))}
    </View>
  );
};

const styles = StyleSheet.create({
  metaBlock: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaLabel: {
    color: META_TEXT_COLOR,
  },
  metaValue: {
    color: META_TEXT_COLOR,
  },

  introBlock: {
    marginBottom: 28,
  },
  paragraph: {
    lineHeight: 28,
    marginBottom: 14,
  },

  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitle: {
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 12,
  },

  itemBlock: {
    marginBottom: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 18,
    lineHeight: 28,
  },

  itemText: {
    flex: 1,
    lineHeight: 28,
  },
  noteText: {
    marginTop: 4,
    marginLeft: 18,
    lineHeight: 28,
  },

  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subParagraph: {
    lineHeight: 28,
    marginBottom: 4,
  },
  footerTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
});
