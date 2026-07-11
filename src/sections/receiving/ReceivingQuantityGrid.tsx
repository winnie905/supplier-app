import { Text, VStack } from 'design-system-native';
import type { FocusEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { QuantityStepper } from '@/components/QuantityStepper';
import type { SizeQuantity } from '@/types/receiving';

interface ReceivingQuantityGridProps {
  sizes: string[];
  values: SizeQuantity[];
  onChange: (values: SizeQuantity[]) => void;
  allowDecimal?: boolean;
  showStepLarge?: boolean;
  stepLarge?: number;
  editable?: boolean;
  onInputFocus?: (event: FocusEvent) => void;
}

export const ReceivingQuantityGrid = ({
  sizes,
  values,
  onChange,
  allowDecimal = false,
  showStepLarge = true,
  stepLarge = 10,
  editable = true,
  onInputFocus,
}: ReceivingQuantityGridProps) => {
  const getValue = (size: string) => values.find((item) => item.size === size)?.quantity ?? 0;

  const updateValue = (size: string, next: number) => {
    const exists = values.some((item) => item.size === size);
    if (exists) {
      onChange(values.map((item) => (item.size === size ? { ...item, quantity: next } : item)));
      return;
    }
    onChange([...values, { size, quantity: next }]);
  };

  return (
    <View style={styles.wrap}>
      {sizes.map((size) => (
        <VStack key={size} gap={4}>
          <Text style={styles.sizeLabel}>{size}</Text>
          <QuantityStepper
            allowDecimal={allowDecimal}
            editable={editable}
            onChange={(next) => updateValue(size, next)}
            {...(onInputFocus ? { onInputFocus } : {})}
            showStepLarge={showStepLarge}
            stepLarge={stepLarge}
            value={getValue(size)}
          />
        </VStack>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
});
