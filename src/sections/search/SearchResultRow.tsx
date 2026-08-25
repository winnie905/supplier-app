import { designTokens } from 'design-system-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SearchIcon from '@/assets/icons/search.svg';
import { HighlightedText } from '@/components/HighlightedText';

const HIGHLIGHT_COLOR = designTokens.colors.brand[500];

interface SearchResultRowProps {
  title: string;
  keyword: string;
  secondLeft: string;
  thirdLine: string;
  /** 有值时第二行右侧展示颜色（收发搜索） */
  colorLabel?: string;
  isLast: boolean;
  onPress: () => void;
}

export const SearchResultRow = ({
  title,
  keyword,
  secondLeft,
  thirdLine,
  colorLabel,
  isLast,
  onPress,
}: SearchResultRowProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.resultItem, !isLast && styles.resultItemBorder]}
  >
    <View style={styles.resultTitleRow}>
      <SearchIcon width={16} height={16} />
      <View style={styles.resultTitleWrap}>
        <HighlightedText
          text={title}
          keyword={keyword}
          style={styles.resultTitle}
          highlightStyle={styles.resultTitleHighlight}
        />
      </View>
    </View>
    {colorLabel != null ? (
      <View style={styles.resultMetaRow}>
        <Text style={styles.resultMetaLeft}>{secondLeft}</Text>
        <Text style={styles.resultMetaRight} numberOfLines={1}>
          {colorLabel}
        </Text>
      </View>
    ) : (
      <Text style={styles.resultMetaSecond}>{secondLeft}</Text>
    )}
    <Text style={styles.resultMetaThird} numberOfLines={1}>
      {thirdLine}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: designTokens.colors.gray[0],
  },
  resultItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDF3',
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#021626',
    fontWeight: '600',
  },
  resultTitleHighlight: {
    fontSize: 16,
    lineHeight: 22,
    color: HIGHLIGHT_COLOR,
    fontWeight: '600',
  },
  resultMetaSecond: {
    marginTop: 8,
    marginLeft: 22,
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginLeft: 22,
    gap: 12,
  },
  resultMetaLeft: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
  resultMetaRight: {
    flexShrink: 0,
    maxWidth: '42%',
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
  resultMetaThird: {
    marginTop: 4,
    marginLeft: 22,
    fontSize: 14,
    lineHeight: 18,
    color: '#6C829E',
  },
});
