import { Button } from 'design-system-native';
import React from 'react';

import { useAppTheme } from '@/hooks/useAppTheme';

interface MeLogoutSectionProps {
  label: string;
  onPress: () => void;
}

export const MeLogoutSection = ({ label, onPress }: MeLogoutSectionProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <Button
      onPress={onPress}
      style={{
        backgroundColor: '#fff',
        borderWidth: 0,
        height: 48,
        borderRadius: 12,
      }}
      textStyle={{ color: colors.text, fontSize: tokens.typography.fontSize.lg }}
    >
      {label}
    </Button>
  );
};
