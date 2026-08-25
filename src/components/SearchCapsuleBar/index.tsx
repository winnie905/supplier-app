import { designTokens, Pressable, Text } from 'design-system-native';
import { forwardRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import SearchIcon from '@/assets/icons/search.svg';

interface SearchCapsuleBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SearchCapsuleBar = forwardRef<TextInput, SearchCapsuleBarProps>(
  (
    {
      value,
      onChangeText,
      onSearch,
      onClear,
      placeholder = '搜索大货款号/客户PO/品牌',
      autoFocus = false,
      style,
    },
    ref,
  ) => {
    const handleClear = () => {
      onChangeText('');
      onClear?.();
    };

    return (
      <View style={[styles.capsule, style]}>
        <SearchIcon width={16} height={16} style={styles.searchIcon} />
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          blurOnSubmit={false}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder={placeholder}
          placeholderTextColor="#A8BBD4"
          returnKeyType="search"
          showSoftInputOnFocus
          style={styles.input}
          value={value}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityLabel="清除"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClear}
            style={styles.clearBtn}
          >
            <View style={styles.clearIcon}>
              <Text style={styles.clearGlyph}>×</Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onSearch} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </Pressable>
      </View>
    );
  },
);

SearchCapsuleBar.displayName = 'SearchCapsuleBar';

const styles = StyleSheet.create({
  capsule: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: designTokens.colors.gray[50],
    borderRadius: 8,
    overflow: 'hidden',
    paddingLeft: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 15,
    color: '#061B37',
  },
  clearBtn: {
    paddingHorizontal: 6,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C8D4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearGlyph: {
    fontSize: 14,
    lineHeight: 16,
    color: designTokens.colors.gray[0],
    fontWeight: '700',
  },
  searchBtn: {
    height: 30,
    paddingHorizontal: 8,
    backgroundColor: designTokens.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 5,
  },
  searchBtnText: {
    color: designTokens.colors.gray[0],
    fontSize: 15,
  },
});
