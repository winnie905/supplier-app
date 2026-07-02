import { Box, HStack, Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import ChevronRightIcon from '@/assets/icons/arrowRight.svg';
import { SETTINGS_LIST_ITEM_HEIGHT } from '@/constants/app';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SettingsListItemProps {
  icon: ReactNode;
  onPress: () => void;
  rightLabel?: string;
  title: string;
  isLast?: boolean;
}

export const SettingsListItem = ({
  icon,
  onPress,
  rightLabel,
  title,
  isLast = false,
}: SettingsListItemProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <HStack
        alignItems="center"
        justifyContent="space-between"
        style={[
          styles.container,
          {
            borderBottomColor: '#F1F4FD',
            borderBottomWidth: isLast ? 0 : 1,
          },
        ]}
      >
        <HStack alignItems="center" style={{ flex: 1, gap: tokens.spacing.xs }}>
          <Box style={styles.iconBox}>{icon}</Box>

          <Text
            numberOfLines={1}
            style={{
              color: colors.text,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: 400,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            {title}
          </Text>
        </HStack>

        <HStack alignItems="center" style={{ gap: tokens.spacing.sm }}>
          {rightLabel ? (
            <Text
              numberOfLines={1}
              style={{
                color: '#A4B2C7',
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: 400,
                includeFontPadding: false,
                textAlignVertical: 'center',
              }}
            >
              {rightLabel}
            </Text>
          ) : null}

          <ChevronRightIcon color="#A4B2C7" height={16} width={16} />
        </HStack>
      </HStack>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    height: SETTINGS_LIST_ITEM_HEIGHT,
  },

  container: {
    height: SETTINGS_LIST_ITEM_HEIGHT,
  },

  iconBox: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
});
