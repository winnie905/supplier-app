import { Text } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

export interface RecordDetailItem {
  key: string;
  label: string;
  value: string | number;
}

interface RecordDetailPanelProps {
  /** Optional first row (e.g. 扎数：2). Omit for size-only lists. */
  primaryLabel?: string;
  primaryValue?: string | number;
  items: RecordDetailItem[];
}

export const RecordDetailPanel = ({
  primaryLabel,
  primaryValue,
  items,
}: RecordDetailPanelProps) => {
  const hasPrimary = primaryLabel != null && primaryValue != null;

  return (
    <View style={styles.panel}>
      {hasPrimary ? (
        <Text style={styles.primary}>
          {primaryLabel}：{primaryValue}
        </Text>
      ) : null}
      {items.map((item, index) => (
        <View key={item.key}>
          {hasPrimary || index > 0 ? <View style={styles.divider} /> : null}
          <Text style={[styles.item, !hasPrimary && index === 0 && styles.itemFirst]}>
            {item.label}：{item.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#021626',
    paddingVertical: 4,
  },
  item: {
    fontSize: 14,
    color: '#6B7A90',
    paddingVertical: 8,
  },
  itemFirst: {
    paddingTop: 4,
  },
  divider: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#CBD5E5',
  },
});
