import { Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type BadgeTone = 'blue' | 'red' | 'gray' | 'green' | 'orange';

interface ReceivingStatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  compact?: boolean;
  icon?: ReactNode;
}

const TONE_STYLES: Record<BadgeTone, { bg: string; text: string; borderColor: string }> = {
  blue: { bg: '#E8F1FC', text: '#105FC8', borderColor: '#C8DFFF' },
  red: { bg: '#FDECEC', text: '#E5484D', borderColor: '#FDECEC' },
  gray: { bg: '#EEF2F7', text: '#6B7A90', borderColor: '#EEF2F7' },
  green: { bg: '#E8F8EF', text: '#1A9F5C', borderColor: '#E8F8EF' },
  orange: { bg: '#FFF3E6', text: '#E67E22', borderColor: '#FFF3E6' },
};

export const ReceivingStatusBadge = ({
  label,
  tone = 'blue',
  compact = false,
  icon,
}: ReceivingStatusBadgeProps) => {
  const palette = TONE_STYLES[tone];

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        { backgroundColor: palette.bg, borderColor: palette.borderColor },
      ]}
    >
      {icon}
      <Text style={[styles.text, compact ? styles.textCompact : null, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },
  badgeCompact: {
    height: undefined,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
  textCompact: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
