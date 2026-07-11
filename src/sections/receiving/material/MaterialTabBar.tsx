import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export const MaterialTabBar = ({ tabs, activeTab, onTabPress }: MaterialTabBarProps) => (
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
          <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          {active ? <View style={styles.tabUnderline} /> : null}
        </Pressable>
      );
    })}
  </View>
);

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
    fontSize: 14,
    color: '#6B7A90',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#105FC8',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#105FC8',
  },
});
