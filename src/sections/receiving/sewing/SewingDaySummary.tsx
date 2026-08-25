import { designTokens } from 'design-system-native';
import { StyleSheet, Text, View } from 'react-native';

/** 单条车位记录的汇总：草稿与历史记录都展示 */
export const SewingDaySummary = ({
  up,
  down,
  pending,
}: {
  up: number;
  down: number;
  pending: number;
}) => (
  <View style={styles.daySummary}>
    <View style={styles.daySummaryRow}>
      <Text style={styles.daySummaryLabel}>当天上车位</Text>
      <Text style={styles.daySummaryValue}>{up}件</Text>
    </View>
    <View style={styles.daySummaryRow}>
      <Text style={styles.daySummaryLabel}>当天下车位</Text>
      <Text style={styles.daySummaryValue}>{down}件</Text>
    </View>
    <View style={styles.daySummaryRow}>
      <Text style={styles.daySummaryLabel}>当日上下车位差异</Text>
      <Text style={styles.daySummaryValue}>{Math.abs(up - down)}件</Text>
    </View>
    <View style={styles.daySummaryRow}>
      <Text style={styles.daySummaryLabel}>全部待车</Text>
      <Text style={styles.daySummaryValue}>{pending}件</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  daySummary: {
    gap: 16,
    backgroundColor: '#F7F9FA',
    borderRadius: 8,
    padding: 16,
  },
  daySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryLabel: {
    fontSize: 16,
    color: '#021626',
    fontWeight: 600,
  },
  daySummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.brand[500],
  },
});
