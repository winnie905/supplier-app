import { designTokens, Text } from 'design-system-native';
import { Pressable, StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import { SETTINGS_LIST_ITEM_HEIGHT } from '@/constants/app';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SettingsSelectionOption<TValue extends string> {
  key: TValue;
  label: string;
}

interface SettingsSelectionListProps<TValue extends string> {
  onSelect: (value: TValue) => void;
  options: SettingsSelectionOption<TValue>[];
  value: TValue;
}

const CARD_RADIUS = 12;

export const SettingsSelectionList = <TValue extends string>({
  onSelect,
  options,
  value,
}: SettingsSelectionListProps<TValue>) => {
  const { colors, tokens } = useAppTheme();

  const fontSize = tokens.typography.fontSize.lg;

  return (
    <View style={styles.card}>
      {options.map((option, index) => {
        const isSelected = option.key === value;
        const isLast = index === options.length - 1;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={styles.optionPressable}
          >
            <View
              style={[
                styles.optionContent,
                {
                  paddingHorizontal: tokens.spacing.lg,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.optionText,
                  {
                    color: colors.text,
                    fontSize,
                  },
                ]}
              >
                {option.label}
              </Text>

              {isSelected ? <CheckIcon color={colors.primary} height={16} width={16} /> : null}

              {!isLast ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.divider,
                    {
                      left: tokens.spacing.lg,
                      right: tokens.spacing.lg,
                    },
                  ]}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    backgroundColor: designTokens.colors.gray[0],
  },
  optionPressable: {
    height: SETTINGS_LIST_ITEM_HEIGHT,
  },
  optionContent: {
    flex: 1,
    height: SETTINGS_LIST_ITEM_HEIGHT,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  optionText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    backgroundColor: '#F1F4FD',
  },
});
