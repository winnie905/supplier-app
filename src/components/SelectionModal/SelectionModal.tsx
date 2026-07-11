import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import { ClearableInput } from '@/components/ClearableInput';
import { DrawerModal, type DrawerModalHeight } from '@/components/SelectionModal/DrawerModal';
import { useAppTheme } from '@/hooks/useAppTheme';

export type SelectionModalValue = string | number;

export interface SelectionModalOption<Value extends SelectionModalValue = SelectionModalValue> {
  value: Value;
  label: string;
  disabled?: boolean;
}

interface RenderOptionParams<Option extends SelectionModalOption<SelectionModalValue>> {
  item: Option;
  selected: boolean;
}

interface SelectionModalProps<Option extends SelectionModalOption<SelectionModalValue>> {
  visible: boolean;
  title: string;
  options: Option[];
  value?: Option['value'];
  searchPlaceholder?: string;
  searchable?: boolean;
  emptyText?: string;
  closeOnSelect?: boolean;
  height?: DrawerModalHeight;
  onClose: () => void;
  onSelect: (option: Option) => void;
  getSearchText?: (option: Option) => string;
  renderOption?: (params: RenderOptionParams<Option>) => ReactNode;
}

/** 基于 DrawerModal 的列表选择弹窗（含可选搜索） */
export function SelectionModal<Option extends SelectionModalOption<SelectionModalValue>>({
  visible,
  title,
  options,
  value,
  searchPlaceholder,
  searchable = true,
  emptyText,
  closeOnSelect = true,
  height = 'auto',
  onClose,
  onSelect,
  getSearchText,
  renderOption,
}: SelectionModalProps<Option>) {
  const [keyword, setKeyword] = useState('');
  const { colors } = useAppTheme();
  const resolvedSearchPlaceholder = searchPlaceholder ?? '搜索';
  const resolvedEmptyText = emptyText ?? '暂无数据';

  const filteredOptions = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();
    if (!searchText) return options;
    return options.filter((option) => {
      const text = getSearchText ? getSearchText(option) : option.label;
      return text.toLowerCase().includes(searchText);
    });
  }, [getSearchText, keyword, options]);

  const handleClose = () => {
    setKeyword('');
    onClose();
  };

  const handleSelect = (option: Option) => {
    if (option.disabled) return;
    onSelect(option);
    if (closeOnSelect) {
      setKeyword('');
      onClose();
    }
  };

  return (
    <DrawerModal
      visible={visible}
      title={title}
      onClose={handleClose}
      height={height}
      showCloseButton={false}
      showBackButton
      scrollable={false}
      bodyStyle={styles.body}
    >
      {searchable ? (
        <ClearableInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setKeyword}
          placeholder={resolvedSearchPlaceholder}
          placeholderTextColor="#A8BBD4"
          returnKeyType="search"
          value={keyword}
          style={styles.searchInput}
          inputFieldStyle={styles.searchInputField}
        />
      ) : null}

      <FlatList
        data={filteredOptions}
        keyExtractor={(item) => String(item.value)}
        keyboardShouldPersistTaps="handled"
        style={styles.listFlex}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{resolvedEmptyText}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = item.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={item.disabled}
              onPress={() => handleSelect(item)}
              style={[styles.option, item.disabled && styles.optionDisabled]}
            >
              {renderOption ? (
                renderOption({ item, selected })
              ) : (
                <>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text },
                      selected && styles.optionSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selected ? <CheckIcon width={14} height={14} color={colors.primary} /> : null}
                </>
              )}
            </Pressable>
          );
        }}
      />
    </DrawerModal>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  searchInput: {
    height: 44,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F8FD',
  },
  searchInputField: {
    color: '#1F2937',
    fontSize: 15,
  },
  listFlex: {
    flex: 1,
  },
  option: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEFF7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    textAlign: 'left',
  },
  optionSelected: {
    color: '#105FC8',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8A98AD',
    fontSize: 14,
  },
});
