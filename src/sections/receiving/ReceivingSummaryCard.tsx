import { designTokens } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryRow {
  label: string;
  value: string;
}

/** 记录页底部汇总卡：裁床 / 尾部共用，children 用于卡内附加区块 */
export const ReceivingSummaryCard = ({
  rows,
  children,
}: {
  rows: SummaryRow[];
  children?: ReactNode;
}) => (
  <View style={styles.summary}>
    {rows.map((row) => (
      <View key={row.label} style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{row.label}</Text>
        <Text style={styles.summaryValue}>{row.value}</Text>
      </View>
    ))}
    {children}
  </View>
);

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: 10,
    marginBottom: 8,
    gap: 16,
    backgroundColor: designTokens.colors.gray[0],
    borderRadius: 18,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#021626',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: designTokens.colors.brand[500],
    fontWeight: '700',
  },
});
