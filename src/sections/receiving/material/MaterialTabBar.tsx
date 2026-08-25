import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import type { MaterialCategory } from '@/types/receiving';

export interface MaterialTabItem {
  key: MaterialCategory;
  label: string;
}

interface MaterialTabBarProps {
  tabs: MaterialTabItem[];
  activeTab: MaterialCategory;
  onTabPress: (category: MaterialCategory) => void;
}

export const MaterialTabBar = ({ tabs, activeTab, onTabPress }: MaterialTabBarProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            onPress={() => onTabPress(tab.key)}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabText,
                active && styles.tabTextActive,
                active && { color: colors.primary },
              ]}
            >
              {tab.label}
            </Text>
            {active ? (
              <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#6B7A90',
  },
  tabTextActive: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
});
