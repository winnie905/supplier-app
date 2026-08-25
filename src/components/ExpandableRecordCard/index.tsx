import { designTokens, Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import ArrowRightIcon from '@/assets/icons/caretRight.svg';

interface ExpandableRecordCardProps {
  title: string;
  /** Header subtitle; pass any React node (e.g. styled Text). */
  subtitle?: ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
  /**
   * Right-side header action slot.
   * Pass edit / delete / custom controls, or omit for none.
   */
  headerRight?: ReactNode;
  /** Expanded body content (edit form, detail panels, summaries, etc.). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ExpandableRecordCard = ({
  title,
  subtitle,
  expanded,
  onToggleExpand,
  headerRight,
  children,
  style,
}: ExpandableRecordCardProps) => (
  <View style={[styles.card, style]}>
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        hitSlop={20}
        onPress={onToggleExpand}
        style={styles.headerMain}
      >
        <ArrowRightIcon
          color="#6B7A90"
          height={12}
          width={12}
          style={expanded ? styles.chevronExpanded : undefined}
        />
        <Text style={styles.title}>{title}</Text>
        {subtitle}
      </Pressable>
      {headerRight}
    </View>

    {expanded ? <View style={styles.body}>{children}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    backgroundColor: '#F0F3F7',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: designTokens.colors.gray[0],
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#061B37',
  },
  body: {
    padding: 16,
    gap: 16,
    backgroundColor: designTokens.colors.gray[0],
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
});
