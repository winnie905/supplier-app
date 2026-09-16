import { designTokens, Text } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

import type { SizeQuantity } from '@/types/receiving';

export interface RecordDetailItem {
  key: string;
  label: string;
  value: string | number;
}

/** 按计划码数顺序生成明细行，缺失码数补 0 */
export const toSizeDetailItems = (sizes: string[], values: SizeQuantity[]): RecordDetailItem[] =>
  sizes.map((size) => ({
    key: size,
    label: size,
    value: values.find((item) => item.size === size)?.quantity ?? 0,
  }));

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
            <Text style={styles.itemLabel}>{item.label}：</Text>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: designTokens.colors.gray[50],
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
  itemLabel: {
    fontWeight: '600',
  },
  itemFirst: {
    paddingTop: 4,
  },
  divider: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#BCD4F4',
  },
});
