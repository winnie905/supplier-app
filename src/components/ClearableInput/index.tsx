import { Input, InputField, InputSlot } from 'design-system-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  type StyleProp,
  StyleSheet,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

interface ClearableInputProps {
  value?: string;
  onChangeText: (value: string) => void;
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
  placeholder?: string;
  placeholderTextColor?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
  keyboardType?: TextInputProps['keyboardType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: TextInputProps['autoCorrect'];
  secureTextEntry?: TextInputProps['secureTextEntry'];
  maxLength?: TextInputProps['maxLength'];
  style?: StyleProp<ViewStyle>;
  inputFieldStyle?: StyleProp<TextStyle>;
}

export const ClearableInput = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  placeholderTextColor = '#C8D4E5',
  disabled = false,
  showClearButton = true,
  onClear,
  keyboardType,
  returnKeyType,
  textContentType,
  autoCapitalize,
  autoCorrect,
  secureTextEntry,
  maxLength,
  style,
  inputFieldStyle,
}: ClearableInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps['onBlur'] = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const visibleClearButton = isFocused && !disabled && showClearButton && !!value;

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      <Input style={styles.input}>
        <InputField
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          style={[styles.inputField, inputFieldStyle]}
        />

        {visibleClearButton ? (
          <InputSlot onPress={handleClear} style={styles.clearSlot}>
            <View style={styles.clearIconFilled}>
              <X size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </InputSlot>
        ) : null}
      </Input>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F5F8FD',
    flexDirection: 'row',
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.6,
  },

  input: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',
    minHeight: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputField: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    color: '#1F2937',
    fontSize: 16,
    textAlignVertical: 'center',
    paddingHorizontal: 0,
  },

  clearSlot: {
    width: 40,
    height: '100%',
    minHeight: 0,
    padding: 0,
    margin: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  clearIconFilled: {
    width: 16,
    height: 16,
    borderRadius: 9,
    backgroundColor: '#C8D4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
