import { VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import React from 'react';

import { SettingsListItem } from '@/components/setting/SettingsListItem';

interface SettingsItem {
  icon: ReactNode;
  onPress?: () => void;
  rightLabel?: ReactNode;
  title: string;
}

interface MeSettingsSectionProps {
  items: SettingsItem[];
}

export const MeSettingsSection = ({ items }: MeSettingsSectionProps) => {
  return (
    <VStack style={{ paddingHorizontal: 0, gap: 0 }}>
      {items.map((item, index) => (
        <SettingsListItem
          key={item.title}
          icon={item.icon}
          title={item.title}
          isLast={index === items.length - 1}
          {...(item.onPress ? { onPress: item.onPress } : {})}
          {...(item.rightLabel ? { rightLabel: item.rightLabel } : {})}
        />
      ))}
    </VStack>
  );
};
