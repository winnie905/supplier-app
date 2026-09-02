import { designTokens, Pressable, Text } from 'design-system-native';
import { useCallback, useState } from 'react';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import ChevronRightIcon from '@/assets/icons/chevronRight.svg';
import type { DeliverySortOrder } from '@/types/apps';

const THEME_BLUE = designTokens.colors.brand[500];
const MENU_WIDTH = 112;

const SORT_OPTIONS: { key: DeliverySortOrder; label: string }[] = [
  { key: 'asc', label: '正序' },
  { key: 'desc', label: '倒序' },
];

interface DeliverySortMenuProps {
  value: DeliverySortOrder;
  onChange: (value: DeliverySortOrder) => void;
}

export const DeliverySortMenu = ({ value, onChange }: DeliverySortMenuProps) => {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const select = useCallback(
    (next: DeliverySortOrder) => {
      setOpen(false);
      if (next !== value) {
        onChange(next);
      }
    },
    [onChange, value],
  );

  return (
    <View style={styles.wrap}>
      {open ? (
        <RNPressable
          accessibilityLabel="关闭排序菜单"
          accessibilityRole="button"
          onPress={close}
          style={styles.backdrop}
        />
      ) : null}

      <Pressable
        accessibilityLabel="最后交期排序"
        accessibilityRole="button"
        hitSlop={8}
        onPress={toggle}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>最后交期</Text>
        <ChevronRightIcon color={THEME_BLUE} height={14} width={14} style={styles.chevron} />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {SORT_OPTIONS.map((option) => {
            const selected = option.key === value;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => select(option.key)}
                style={styles.option}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {selected ? <CheckIcon color={THEME_BLUE} height={14} width={14} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    marginVertical: 12,
    zIndex: 20,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    top: -999,
    right: -999,
    bottom: -999,
    left: -999,
    zIndex: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 2,
  },
  triggerText: {
    fontSize: 14,
    color: THEME_BLUE,
  },
  chevron: {
    transform: [{ rotate: '90deg' }],
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    zIndex: 3,
    width: MENU_WIDTH,
    borderRadius: 8,
    backgroundColor: designTokens.colors.gray[0],
    paddingVertical: 4,
    shadowColor: '#061B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 24,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#182A43',
  },
  optionTextSelected: {
    color: THEME_BLUE,
    fontWeight: '600',
  },
});
