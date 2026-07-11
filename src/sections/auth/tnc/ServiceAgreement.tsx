import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { LEGAL_SERVICE_AGREEMENT } from '@/constants/legalContent';
import { TNC_DOCUMENT_TITLES } from '@/constants/tnc';
import { useAppTheme } from '@/hooks/useAppTheme';

const META_TEXT_COLOR = '#6B7A90';

const formatEffectiveDateLabel = (isoDate?: string, fallback?: string) => {
  if (!isoDate) {
    return fallback ?? '';
  }

  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }

  return `${year}年${month}月${day}日`;
};

const splitStrongTag = (value: string): [string, string, string] => {
  const match = /^(.*)<strong>(.*)<\/strong>(.*)$/s.exec(value);

  if (!match) {
    return [value, '', ''];
  }

  return [match[1] ?? '', match[2] ?? '', match[3] ?? ''];
};

interface ServiceAgreementProps {
  version?: string;
  effectiveDate?: string;
}

export const ServiceAgreement = ({ version, effectiveDate }: ServiceAgreementProps) => {
  const { colors, tokens } = useAppTheme();
  const agreement = LEGAL_SERVICE_AGREEMENT;

  const themeStyles = useMemo(
    () => ({
      text: {
        color: colors.text,
      } as TextStyle,
      strong: {
        color: colors.text,
        fontWeight: '700',
      } as TextStyle,
      metaLabel: {
        color: META_TEXT_COLOR,
        fontWeight: tokens.typography.fontWeight.medium as TextStyle['fontWeight'],
      } as TextStyle,
    }),
    [colors.text, tokens.typography.fontWeight.medium],
  );

  const renderMeta = () => {
    const displayEffectiveDate = formatEffectiveDateLabel(
      effectiveDate,
      agreement.meta.effectiveDate,
    );

    return (
      <View style={styles.metaBlock}>
        <Text style={[styles.documentTitle, themeStyles.text]}>
          {TNC_DOCUMENT_TITLES.USER_AGREEMENT}
        </Text>
        {version ? (
          <Text style={styles.metaText}>
            <Text style={themeStyles.metaLabel}>版本号：</Text>
            {version}
          </Text>
        ) : null}
        <Text style={styles.metaText}>
          <Text style={themeStyles.metaLabel}>{agreement.meta.effectiveDateLabel}</Text>
          {displayEffectiveDate}
        </Text>

        <Text style={styles.metaText}>
          <Text style={themeStyles.metaLabel}>{agreement.meta.operatorLabel}</Text>
          {agreement.meta.operator}
        </Text>
      </View>
    );
  };

  const renderIntro = () => {
    const [beforeStrong, strongText, afterStrong] = splitStrongTag(agreement.intro.importantNotice);

    return (
      <View style={styles.sectionBlock}>
        <Text style={[styles.paragraph, themeStyles.text]}>
          {agreement.intro.welcome}
          {beforeStrong}
          <Text style={themeStyles.strong}>{strongText}</Text>
          {afterStrong}
        </Text>
      </View>
    );
  };

  const renderArticle = (
    articleKey: string,
    article: (typeof agreement.articles)[keyof typeof agreement.articles],
  ) => {
    return (
      <View key={articleKey} style={styles.articleBlock}>
        <Text style={[styles.articleTitle, themeStyles.text]}>{article.title}</Text>

        {Object.entries(article.items).map(([itemKey, item]) => {
          const entry = item as { label: string; content: string };

          return (
            <View key={itemKey} style={styles.bulletRow}>
              <Text style={[styles.bullet, themeStyles.text]}>•</Text>

              <Text style={[styles.bulletContent, themeStyles.text]}>
                <Text style={themeStyles.text}>{entry.label}：</Text>
                <Text style={themeStyles.text}>{entry.content}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      {renderMeta()}
      {renderIntro()}
      {Object.entries(agreement.articles).map(([articleKey, article]) =>
        renderArticle(articleKey, article),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metaBlock: {
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 16,
  },
  metaText: {
    lineHeight: 24,
    color: META_TEXT_COLOR,
    marginBottom: 8,
  },

  sectionBlock: {
    marginBottom: 28,
  },
  paragraph: {
    lineHeight: 32,
    marginBottom: 14,
  },

  articleBlock: {
    marginBottom: 28,
  },
  articleTitle: {
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 14,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bullet: {
    width: 18,
    lineHeight: 30,
  },
  bulletContent: {
    flex: 1,
    lineHeight: 30,
  },
});
