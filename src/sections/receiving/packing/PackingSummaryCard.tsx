import { StyleSheet, Text, View } from 'react-native';

export const PackingSummaryCard = ({
  boxCount,
  pieceCount,
}: {
  boxCount: number;
  pieceCount: number;
}) => (
  <View style={styles.summary}>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>装箱数:</Text>
      <Text style={styles.summaryValue}>{boxCount}箱</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>总件数:</Text>
      <Text style={styles.summaryValue}>{pieceCount}件</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: 10,
    marginBottom: 8,
    gap: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#105FC8',
    fontWeight: '700',
  },
});
