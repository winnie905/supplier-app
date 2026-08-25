import { ClearableInput, Pressable, Text } from 'design-system-native';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import zh from 'i18n-iso-countries/langs/zh.json';
import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import { useMemo, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { SelectionModal, type SelectionModalOption } from '@/components/SelectionModal';

countries.registerLocale(zh);
countries.registerLocale(en);

export type PhoneCountryCode = CountryCode;

interface CountryOption extends SelectionModalOption<PhoneCountryCode> {
  callingCode: string;
}

const COUNTRY_LABEL_KEYS: Partial<Record<PhoneCountryCode, string>> = {
  CN: '中国',
  HK: '中国香港',
  MO: '中国澳门',
  TW: '中国台湾',
  AC: '阿森松岛',
  TA: '特里斯坦达库尼亚',
};

export interface PhoneNumberFieldProps {
  country: PhoneCountryCode;
  value?: string;
  placeholder?: string;
  onBlur?: () => void;
  disabled?: boolean;
  onCountryChange: (country: PhoneCountryCode) => void;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const getCallingCodeText = (country: PhoneCountryCode) => {
  return `+${getCountryCallingCode(country)}`;
};

const getCountryLabel = (country: PhoneCountryCode, t: (key: string) => string) => {
  const labelKey = COUNTRY_LABEL_KEYS[country];

  if (labelKey) {
    return t(labelKey);
  }

  return countries.getName(country, 'zh') ?? country;
};

const getDisplayValue = (value: string | undefined, country: PhoneCountryCode) => {
  const text = value?.trim();

  if (!text) return '';

  if (text.startsWith('+')) {
    const phone = parsePhoneNumberFromString(text);

    if (phone?.isValid()) {
      return phone.formatNational().replace(/\s/g, '');
    }
  }

  return new AsYouType(country).input(text).replace(/\s/g, '');
};

const toPhoneValue = (text: string, country: PhoneCountryCode) => {
  const inputText = text.trim();

  if (!inputText) return '';

  const formatter = new AsYouType(country);
  const formattedText = formatter.input(inputText);
  const phone = formatter.getNumber();

  if (phone?.isValid()) {
    return phone.number;
  }

  return formattedText;
};

export const isValidPhoneNumberByCountry = (value: string, country: PhoneCountryCode) => {
  const phone = parsePhoneNumberFromString(value, country);
  if (!phone?.isValid()) {
    return false;
  }

  // 区号 +86：手机号必须为 11 位
  if (getCountryCallingCode(country) === '86') {
    return /^\d{11}$/.test(phone.nationalNumber);
  }

  return true;
};

export const PhoneNumberField = ({
  country,
  value,
  placeholder,
  disabled = false,
  onBlur,
  onCountryChange,
  onChange,
  style,
}: PhoneNumberFieldProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const resolvedPlaceholder = placeholder ?? '请输入手机号';

  const countryOptions = useMemo<CountryOption[]>(() => {
    return getCountries()
      .map((item) => ({
        value: item,
        callingCode: getCallingCodeText(item),
        label: getCallingCodeText(item) + '   ' + getCountryLabel(item, (key) => key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const displayValue = useMemo(() => {
    return getDisplayValue(value, country);
  }, [country, value]);

  const handleTextChange = (text: string) => {
    // 区号 +86：仅允许输入最多 11 位数字
    if (getCountryCallingCode(country) === '86') {
      const digits = text.replace(/\D/g, '').slice(0, 11);
      onChange(toPhoneValue(digits, country));
      return;
    }

    onChange(toPhoneValue(text, country));
  };

  const handleSelectCountry = ({ value: nextCountry }: CountryOption) => {
    onCountryChange(nextCountry);

    if (value) {
      const currentDisplayValue = getDisplayValue(value, country);
      onChange(toPhoneValue(currentDisplayValue, nextCountry));
    }

    setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.field, disabled && styles.disabled, style]}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={8}
          onPress={() => setModalVisible(true)}
          style={styles.countryButton}
        >
          <Text style={styles.countryCode}>{getCallingCodeText(country)}</Text>
          <Text style={styles.arrow}>▼</Text>
        </Pressable>

        <View style={styles.divider} />

        <ClearableInput
          disabled={disabled}
          keyboardType="phone-pad"
          maxLength={getCountryCallingCode(country) === '86' ? 11 : undefined}
          onBlur={onBlur}
          onChangeText={handleTextChange}
          placeholder={resolvedPlaceholder}
          placeholderTextColor="#C8D4E5"
          returnKeyType="done"
          textContentType="telephoneNumber"
          value={displayValue}
          style={styles.phoneInput}
          inputFieldStyle={styles.phoneInputField}
        />
      </View>
      <SelectionModal<CountryOption>
        visible={modalVisible}
        title="选择国家/地区"
        value={country}
        options={countryOptions}
        searchPlaceholder="搜索国家/地区"
        onClose={() => setModalVisible(false)}
        onSelect={handleSelectCountry}
        getSearchText={(item) => `${item.callingCode}${item.label}${item.value}`}
        height="max"
      />
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    width: '100%',
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F8FD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  phoneInputField: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  disabled: {
    opacity: 0.6,
  },
  countryButton: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  countryCode: {
    color: '#1F2937',
    fontSize: 16,
  },
  arrow: {
    marginLeft: 8,
    color: '#1F2937',
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 20,
    marginRight: 12,
    backgroundColor: '#D8E1EF',
  },
});
