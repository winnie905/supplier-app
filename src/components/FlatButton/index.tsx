import { Button, type ButtonProps } from 'design-system-native';
import { type ComponentRef, forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export type FlatButtonProps = ButtonProps;

export const FlatButton = forwardRef<ComponentRef<typeof Button>, FlatButtonProps>(
  ({ style, textStyle, ...rest }, ref) => {
    const { colors } = useAppTheme();
    return (
      <Button
        ref={ref}
        style={[{ backgroundColor: colors.primary }, styles.button, style]}
        textStyle={[styles.text, textStyle]}
        {...rest}
      />
    );
  },
);

FlatButton.displayName = 'FlatButton';

const styles = StyleSheet.create({
  button: {
    borderWidth: 0,
    elevation: 0,
    height: 48,
    shadowColor: 'transparent',
    shadowOffset: {
      height: 0,
      width: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  text: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '400',
  },
});
