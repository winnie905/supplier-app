import { designTokens, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type BadgeTone = 'blue' | 'red' | 'gray' | 'green' | 'orange';

interface ReceivingStatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  compact?: boolean;
  /** 无背景，边框与文字同色 */
  outline?: boolean;
  icon?: ReactNode;
}

const TONE_STYLES: Record<BadgeTone, { bg: string; text: string; borderColor: string }> = {
  blue: { bg: '#E8F1FC', text: designTokens.colors.brand[500], borderColor: '#C8DFFF' },
  red: { bg: '#FDECEC', text: '#E5484D', borderColor: '#FDECEC' },
  gray: { bg: '#EEF2F7', text: '#6B7A90', borderColor: '#EEF2F7' },
  green: { bg: '#E8F8EF', text: '#1A9F5C', borderColor: '#E8F8EF' },
  orange: {
    bg: 'rgba(255, 167, 23, 0.1)',
    text: designTokens.colors.warning,
    borderColor: 'rgba(255, 167, 23, 0.1)',
  },
};

/** outline 模式下边框/文字统一色（已到料用 success 绿） */
const OUTLINE_COLORS: Partial<Record<BadgeTone, string>> = {
  blue: designTokens.colors.brand[500],
  green: designTokens.colors.success,
  red: '#E5484D',
  gray: '#6B7A90',
  orange: '#FFA717',
};

export const ReceivingStatusBadge = ({
  label,
  tone = 'blue',
  compact = false,
  outline = false,
  icon,
}: ReceivingStatusBadgeProps) => {
  const palette = TONE_STYLES[tone];
  const outlineColor = OUTLINE_COLORS[tone] ?? palette.text;

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        outline
          ? { backgroundColor: 'transparent', borderColor: outlineColor }
          : { backgroundColor: palette.bg, borderColor: palette.borderColor },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          compact ? styles.textCompact : null,
          { color: outline ? outlineColor : palette.text },
        ]}
      >
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
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
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
    fontWeight: '500',
  },
});
