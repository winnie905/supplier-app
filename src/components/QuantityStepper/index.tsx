import { designTokens, Pressable, Text } from 'design-system-native';
import { useState } from 'react';
import type { FocusEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import MinusIcon from '@/assets/icons/minus.svg';
import PlusIcon from '@/assets/icons/plus.svg';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  allowDecimal?: boolean;
  /** Whether to show ±stepLarge buttons. Defaults to true. */
  showStepLarge?: boolean;
  stepLarge?: number;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
  onInputFocus?: (event: FocusEvent) => void;
}

const STEP_ICON_COLOR = '#000000';
const STEP_DISABLED_COLOR = '#BAC0CA';
const ICON_COLOR = '#021626';

/** 小数位数上限（如箱重保留两位） */
const DECIMAL_PLACES = 2;
const DECIMAL_FACTOR = 10 ** DECIMAL_PLACES;

const clampNumber = (value: number, allowDecimal: boolean) => {
  const safe = Number.isFinite(value) ? value : 0;
  if (allowDecimal) {
    return Math.max(0, Math.round(safe * DECIMAL_FACTOR) / DECIMAL_FACTOR);
  }
  return Math.max(0, Math.floor(safe));
};

const sanitizeNumericText = (text: string, allowDecimal: boolean) => {
  if (allowDecimal) {
    const cleaned = text.replace(/[^\d.]/g, '');
    const [head = '', ...rest] = cleaned.split('.');
    if (rest.length === 0) return head;
    return `${head}.${rest.join('').slice(0, DECIMAL_PLACES)}`;
  }
  return text.replace(/\D/g, '');
};

export const QuantityStepper = ({
  value,
  onChange,
  allowDecimal = false,
  showStepLarge = true,
  stepLarge = 10,
  editable = true,
  style,
  onInputFocus,
}: QuantityStepperProps) => {
  /** 输入过程中的原始文本：保留「1.」「1.0」这类中间态，避免被数值回写吞掉小数点 */
  const [draft, setDraft] = useState<string | null>(null);

  const setValue = (next: number) => {
    if (!editable) return;
    setDraft(null);
    onChange(clampNumber(next, allowDecimal));
  };

  // 无数值 / 0：减号禁用；大于 0 开启减号；大于 stepLarge-1（默认 9）开启 -stepLarge
  const decreaseDisabled = !editable || value <= 0;
  const decreaseLargeDisabled = !editable || value <= stepLarge - 1;

  return (
    <View style={[styles.stepper, style]}>
      {showStepLarge ? (
        <Pressable
          accessibilityRole="button"
          disabled={decreaseLargeDisabled}
          hitSlop={16}
          onPress={() => setValue(value - stepLarge)}
          style={[styles.stepBtn, decreaseLargeDisabled && styles.stepBtnDisabled]}
        >
          <MinusIcon
            color={decreaseLargeDisabled ? STEP_DISABLED_COLOR : STEP_ICON_COLOR}
            height={12}
            width={12}
          />
          <Text style={[styles.stepText, decreaseLargeDisabled && styles.stepTextDisabled]}>
            {stepLarge}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.inputShell}>
        <Pressable
          accessibilityRole="button"
          disabled={decreaseDisabled}
          hitSlop={16}
          onPress={() => setValue(value - 1)}
          style={styles.iconBtn}
        >
          <MinusIcon
            color={decreaseDisabled ? STEP_DISABLED_COLOR : ICON_COLOR}
            height={16}
            width={16}
          />
        </Pressable>
        <TextInput
          editable={editable}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          onChangeText={(text) => {
            if (!editable) return;
            const cleaned = sanitizeNumericText(text, allowDecimal);
            setDraft(cleaned);
            if (cleaned === '' || cleaned === '.') {
              onChange(0);
              return;
            }
            const parsed = allowDecimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
            onChange(clampNumber(Number.isNaN(parsed) ? 0 : parsed, allowDecimal));
          }}
          onBlur={() => setDraft(null)}
          onFocus={onInputFocus}
          style={styles.input}
          value={draft ?? (value === 0 ? '' : String(value))}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!editable}
          hitSlop={16}
          onPress={() => setValue(value + 1)}
          style={styles.iconBtn}
        >
          <PlusIcon color={editable ? ICON_COLOR : STEP_DISABLED_COLOR} height={16} width={16} />
        </Pressable>
      </View>

      {showStepLarge ? (
        <Pressable
          accessibilityRole="button"
          disabled={!editable}
          hitSlop={16}
          onPress={() => setValue(value + stepLarge)}
          style={[styles.stepBtn, !editable && styles.stepBtnDisabled]}
        >
          <PlusIcon
            color={editable ? STEP_ICON_COLOR : STEP_DISABLED_COLOR}
            height={12}
            width={12}
          />
          <Text style={[styles.stepText, !editable && styles.stepTextDisabled]}>{stepLarge}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    borderRadius: 8,
    backgroundColor: '#E6F0FF',
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtnDisabled: {
    backgroundColor: designTokens.colors.gray[50],
  },
  stepText: {
    fontSize: 14,
    color: '#061B37',
    fontWeight: '600',
  },
  stepTextDisabled: {
    color: '#BAC0CA',
  },
  inputShell: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: designTokens.colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 14,
    color: '#021626',
  },
});
