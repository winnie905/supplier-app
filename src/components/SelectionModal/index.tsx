import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  FlatList,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import CheckIcon from '@/assets/icons/check.svg';
import CloseIcon from '@/assets/icons/close.svg';
import { AppModal } from '@/components/AppModal';
import { ClearableInput } from '@/components/ClearableInput';
import { useAppTheme } from '@/hooks/useAppTheme';

export type SelectionModalValue = string | number;

export type SelectionModalHeight = 'auto' | 'max' | number;

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
  height?: SelectionModalHeight;
  sheetStyle?: StyleProp<ViewStyle>;
  onClose: () => void;
  onSelect: (option: Option) => void;
  getSearchText?: (option: Option) => string;
  renderOption?: (params: RenderOptionParams<Option>) => ReactNode;
  showCloseButton?: boolean;
}

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
  sheetStyle,
  onClose,
  onSelect,
  getSearchText,
  renderOption,
  showCloseButton = false,
}: SelectionModalProps<Option>) {
  const [keyword, setKeyword] = useState('');
  const { colors } = useAppTheme();
  const resolvedSearchPlaceholder = searchPlaceholder ?? '搜索';
  const resolvedEmptyText = emptyText ?? '暂无数据';
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  const maxSheetHeight = window.height - insets.top;

  const sheetHeightStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (height === 'max') {
      return {
        flex: 1,
        marginTop: insets.top,
      };
    }

    if (height === 'auto') {
      return {
        maxHeight: maxSheetHeight,
      };
    }

    return {
      height: Math.min(height, maxSheetHeight),
    };
  }, [height, insets.top, maxSheetHeight]);

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
    <AppModal
      visible={visible}
      onClose={handleClose}
      animationType="slide"
      closeOnBackdropPress
      backdropStyle={styles.modalRoot}
      cardStyle={[styles.sheet, sheetHeightStyle, sheetStyle]}
    >
      <View style={styles.sheetHeader}>
        {showCloseButton ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClose}
            style={styles.closeButton}
          >
            <CloseIcon width={16} height={16} color="#061B37" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClose}
            style={styles.backButton}
          >
            <BackIcon width={20} height={20} color="#111111" />
          </Pressable>
        )}

        <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
      </View>

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
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sheetHeader: {
    height: 36,
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
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
