import { designTokens, Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

interface DashedButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const DashedButton = ({ label, onPress, icon, style, textStyle }: DashedButtonProps) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[styles.btn, style]}>
    {icon}
    <Text style={[styles.label, textStyle]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: designTokens.colors.brand[500],
    backgroundColor: '#ECF4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontSize: 15,
    color: designTokens.colors.brand[500],
    fontWeight: '600',
  },
});
