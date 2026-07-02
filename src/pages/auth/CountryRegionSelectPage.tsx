import { getCountries, getCountryCallingCode } from 'libphonenumber-js/min';
import { Pressable, Text } from 'design-system-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import { ClearableInput } from '@/components/ClearableInput';
import type { PhoneCountryCode } from '@/components/PhoneNumberField';
import { FEATURED_COUNTRY_CODES } from '@/constants/countryCodes';
import { AUTH_STRINGS, COUNTRY_LABELS } from '@/constants/legalContent';
import { LOGIN_THEME } from '@/constants/loginTheme';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';

type CountryRegionSelectPageProps = AuthScreenProps<'CountryRegionSelect'>;

interface CountryListItem {
  code: PhoneCountryCode;
  callingCode: string;
  label: string;
  featured: boolean;
}

const getCallingCodeText = (country: PhoneCountryCode) => `+${getCountryCallingCode(country)}`;

const getCountryLabel = (country: PhoneCountryCode) => COUNTRY_LABELS[country] ?? country;

export const CountryRegionSelectPage = ({
  navigation,
  route,
}: CountryRegionSelectPageProps) => {
  const { colors } = useAppTheme();
  const { currentCountry } = route.params;
  const [keyword, setKeyword] = useState('');

  const countryItems = useMemo<CountryListItem[]>(() => {
    const featuredSet = new Set(FEATURED_COUNTRY_CODES);

    return getCountries()
      .map((code) => ({
        code,
        callingCode: getCallingCodeText(code),
        label: getCountryLabel(code),
        featured: featuredSet.has(code),
      }))
      .sort((a, b) => {
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }

        return a.label.localeCompare(b.label, 'zh-CN');
      });
  }, []);

  const filteredItems = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    if (!searchText) {
      return countryItems;
    }

    return countryItems.filter((item) => {
      const text = `${item.callingCode}${item.label}${item.code}`.toLowerCase();
      return text.includes(searchText);
    });
  }, [countryItems, keyword]);

  const handleSelect = (country: PhoneCountryCode) => {
    navigation.navigate({
      name: ROUTES.AUTH.LOGIN,
      params: { selectedCountry: country },
      merge: true,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ClearableInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setKeyword}
        placeholder={AUTH_STRINGS.searchCountryOrCode}
        placeholderTextColor={LOGIN_THEME.placeholder}
        returnKeyType="search"
        value={keyword}
        style={styles.searchInput}
        inputFieldStyle={styles.searchInputField}
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = item.code === currentCountry;

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSelect(item.code)}
              style={styles.option}
            >
              <Text style={[styles.optionLabel, selected && styles.optionSelected]}>
                {item.label}
              </Text>
              <View style={styles.optionRight}>
                <Text style={[styles.optionCode, selected && styles.optionSelected]}>
                  {item.callingCode}
                </Text>
                {selected ? <CheckIcon width={14} height={14} color={LOGIN_THEME.primary} /> : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    height: 44,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: LOGIN_THEME.inputRadius,
    backgroundColor: LOGIN_THEME.inputBg,
  },
  searchInputField: {
    color: LOGIN_THEME.textPrimary,
    fontSize: 15,
  },
  option: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LOGIN_THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: LOGIN_THEME.textPrimary,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCode: {
    fontSize: 15,
    color: LOGIN_THEME.textSecondary,
  },
  optionSelected: {
    color: LOGIN_THEME.primary,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: LOGIN_THEME.textMuted,
    fontSize: 14,
  },
});
