import { designTokens, Pressable, Text } from 'design-system-native';
import { memo, useCallback, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import CaretRightIcon from '@/assets/icons/caretRight.svg';
import type { ProductionOrderTab, ProductionOrderTabStat } from '@/types/apps';
import { formatCount } from '@/utils/number';

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

const TabChrome = memo(function TabChrome({
  active,
  gradientId,
}: {
  active: boolean;
  gradientId: string;
}) {
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
              <Stop offset="0.37" stopColor={designTokens.colors.gray[0]} />
              <Stop offset="1" stopColor={designTokens.colors.gray[0]} />
            </LinearGradient>
            <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
              <Stop offset="1" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
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
});

const StatusTabItem = memo(function StatusTabItem({
  tabKey,
  label,
  active,
  orderCount,
  pieceCount,
  gradientId,
  onPress,
}: {
  tabKey: ProductionOrderTab;
  label: string;
  active: boolean;
  orderCount: number;
  pieceCount: number;
  gradientId: string;
  onPress: (tab: ProductionOrderTab) => void;
}) {
  const handlePress = useCallback(() => {
    if (!active) onPress(tabKey);
  }, [active, onPress, tabKey]);

  return (
    <View style={styles.tabWrap}>
      {active ? (
        <View style={styles.pointerWrap} pointerEvents="none">
          <CaretRightIcon width={20} height={20} color="#0063E7" style={styles.pointerIcon} />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        style={[styles.tab, active ? styles.tabActive : null]}
      >
        <TabChrome active={active} gradientId={gradientId} />

        <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
        <Text style={[styles.countRow, active ? styles.countRowActive : null]}>
          <Text style={[styles.countNum, active ? styles.countNumActive : null]}>{orderCount}</Text>
          <Text style={[styles.countUnit, active ? styles.countUnitActive : null]}>单</Text>
        </Text>
        <Text style={[styles.pieces, active ? styles.piecesActive : null]}>
          {formatCount(pieceCount)}件
        </Text>
      </Pressable>
    </View>
  );
});

export const ProductionOrderStatusTabs = memo(function ProductionOrderStatusTabs({
  activeTab,
  tabStats,
  onChange,
}: ProductionOrderStatusTabsProps) {
  const reactId = useId().replace(/:/g, '');

  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const stat = tabStats[tab.key];
        return (
          <StatusTabItem
            key={tab.key}
            tabKey={tab.key}
            label={tab.label}
            active={tab.key === activeTab}
            orderCount={Number(stat.orderCount ?? 0)}
            pieceCount={Number(stat.pieceCount ?? 0)}
            gradientId={`${reactId}-${tab.key}`}
            onPress={onChange}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
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
    paddingHorizontal: 10,
    gap: 2,
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
    color: designTokens.colors.gray[0],
  },
  countRow: {
    textAlign: 'center',
    color: '#111F3E',
  },
  countRowActive: {
    color: designTokens.colors.gray[0],
  },
  countNum: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111F3E',
  },
  countNumActive: {
    color: designTokens.colors.gray[0],
  },
  countUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111F3E',
  },
  countUnitActive: {
    color: designTokens.colors.gray[0],
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
