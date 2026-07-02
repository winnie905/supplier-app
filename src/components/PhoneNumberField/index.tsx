import { Pressable, Text } from 'design-system-native';
import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import { useMemo, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ClearableInput } from '@/components/ClearableInput';
import { SelectionModal, type SelectionModalOption } from '@/components/SelectionModal';
import { AUTH_STRINGS, COUNTRY_LABELS } from '@/constants/legalContent';

export type PhoneCountryCode = CountryCode;

interface CountryOption extends SelectionModalOption<PhoneCountryCode> {
  callingCode: string;
}

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

const getCountryLabel = (country: PhoneCountryCode) => {
  return COUNTRY_LABELS[country] ?? country;
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

  if (!inputText) {
    return '';
  }

  if (inputText.startsWith('+')) {
    return inputText.replace(/\s/g, '');
  }

  return new AsYouType(country).input(inputText).replace(/\s/g, '');
};

export const isValidPhoneNumberByCountry = (value: string, country: PhoneCountryCode) => {
  const phone = parsePhoneNumberFromString(value, country);
  return phone?.isValid() ?? false;
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
  const resolvedPlaceholder = placeholder ?? AUTH_STRINGS.phonePlaceholder;

  const countryOptions = useMemo<CountryOption[]>(() => {
    return getCountries()
      .map((item) => ({
        value: item,
        callingCode: getCallingCodeText(item),
        label: getCallingCodeText(item) + '   ' + getCountryLabel(item),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const displayValue = useMemo(() => {
    return getDisplayValue(value, country);
  }, [country, value]);

  const handleTextChange = (text: string) => {
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
        searchPlaceholder="搜索国家/地区或区号"
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
    height: 52,
    paddingRight: 0,
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
  },

  phoneInputField: {
    paddingLeft: 0,
    paddingRight: 0,
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
