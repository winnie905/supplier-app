import { Pressable, Text } from 'design-system-native';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import CaretRightIcon from '@/assets/icons/caretRight.svg';
import type { ProductionOrderTab, ProductionOrderTabStat } from '@/types/apps';

interface ProductionOrderStatusTabsProps {
  activeTab: ProductionOrderTab;
  tabStats: Record<ProductionOrderTab, ProductionOrderTabStat>;
  onChange: (tab: ProductionOrderTab) => void;
}

const TAB_SIZE = 84;

const TABS: { key: ProductionOrderTab; label: string }[] = [
  { key: 'pending', label: '待生产' },
  { key: 'in_progress', label: '生产中' },
  { key: 'completed', label: '已完成' },
  { key: 'overdue', label: '超期' },
];

const formatCount = (value: number) => value.toLocaleString('en-US');

const TabChrome = ({ active, gradientId }: { active: boolean; gradientId: string }) => {
  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={TAB_SIZE} height={TAB_SIZE}>
      <Defs>
        {active ? (
          <LinearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#56A1E8" />
            <Stop offset="1" stopColor="#0063E7" />
          </LinearGradient>
        ) : (
          <>
            <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#EAF7FF" />
              <Stop offset="0.37" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#FFFFFF" />
            </LinearGradient>
            <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </>
        )}
      </Defs>
      <Rect
        x={active ? 0 : 0.5}
        y={active ? 0 : 0.5}
        width={TAB_SIZE - (active ? 0 : 1)}
        height={TAB_SIZE - (active ? 0 : 1)}
        rx={8}
        ry={8}
        fill={`url(#${fillId})`}
        {...(active
          ? {}
          : {
              stroke: `url(#${strokeId})`,
              strokeWidth: 1,
            })}
      />
    </Svg>
  );
};

export const ProductionOrderStatusTabs = ({
  activeTab,
  tabStats,
  onChange,
}: ProductionOrderStatusTabsProps) => {
  const reactId = useId().replace(/:/g, '');

  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        const stat = tabStats[tab.key];

        return (
          <View key={tab.key} style={styles.tabWrap}>
            {active ? (
              <View style={styles.pointerWrap} pointerEvents="none">
                <CaretRightIcon width={20} height={20} color="#0063E7" style={styles.pointerIcon} />
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => onChange(tab.key)}
              style={[styles.tab, active ? styles.tabActive : null]}
            >
              <TabChrome active={active} gradientId={`${reactId}-${tab.key}`} />

              <Text style={[styles.label, active ? styles.labelActive : null]}>{tab.label}</Text>
              <Text style={[styles.countRow, active ? styles.countRowActive : null]}>
                <Text style={[styles.countNum, active ? styles.countNumActive : null]}>
                  {stat.orderCount}
                </Text>
                <Text style={[styles.countUnit, active ? styles.countUnitActive : null]}>单</Text>
              </Text>
              <Text style={[styles.pieces, active ? styles.piecesActive : null]}>
                {formatCount(stat.pieceCount)}件
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  tabWrap: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    overflow: 'visible',
  },
  tab: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  tabActive: {
    shadowColor: '#D0E0E7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111F3E',
    textAlign: 'center',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  countRow: {
    textAlign: 'center',
    color: '#111F3E',
  },
  countRowActive: {
    color: '#FFFFFF',
  },
  countNum: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111F3E',
  },
  countNumActive: {
    color: '#FFFFFF',
  },
  countUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111F3E',
  },
  countUnitActive: {
    color: '#FFFFFF',
  },
  pieces: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C829E',
    textAlign: 'center',
  },
  piecesActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pointerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -12,
    alignItems: 'center',
    zIndex: 0,
  },
  pointerIcon: {
    transform: [{ rotate: '90deg' }],
  },
});
