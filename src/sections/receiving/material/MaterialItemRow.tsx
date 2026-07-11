import { Pressable, StyleSheet, Text, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import { ReceivingStatusBadge } from '@/sections/receiving/ReceivingStatusBadge';
import type { MaterialItem, MaterialItemStatus } from '@/types/receiving';

const PRIMARY_STATUS: MaterialItemStatus[] = ['pending', 'arrived'];
const WARNING_STATUS: MaterialItemStatus[] = ['shortage', 'quality_issue'];

const STATUS_BADGE: Record<'pending' | 'arrived', { label: string; tone: 'blue' | 'green' }> = {
  pending: { label: '待确认', tone: 'blue' },
  arrived: { label: '已到料', tone: 'green' },
};

const WARNING_LABEL: Record<'shortage' | 'quality_issue', string> = {
  shortage: '缺料',
  quality_issue: '质量问题',
};

export const CircleCheck = ({ checked }: { checked: boolean }) => (
  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
    {checked ? <CheckIcon color="#FFFFFF" height={10} width={10} /> : null}
  </View>
);

export const MaterialItemCard = ({
  item,
  checked,
  onToggle,
}: {
  item: MaterialItem;
  checked: boolean;
  onToggle: () => void;
}) => {
  const primary =
    item.statuses.find((s): s is 'pending' | 'arrived' => PRIMARY_STATUS.includes(s)) ?? 'pending';
  const warnings = item.statuses.filter((s): s is 'shortage' | 'quality_issue' =>
    WARNING_STATUS.includes(s),
  );
  const warningText = warnings.map((s) => WARNING_LABEL[s]).join('、');
  const isSimple = item.category !== 'fabric';

  return (
    <Pressable accessibilityRole="checkbox" onPress={onToggle} style={styles.itemCard}>
      <CircleCheck checked={checked} />
      <View style={styles.itemTitleRow}>
        <View style={styles.itemNameRow}>
          <ReceivingStatusBadge
            compact
            label={STATUS_BADGE[primary].label}
            tone={STATUS_BADGE[primary].tone}
          />
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {warningText ? (
            <View style={styles.warningTag}>
              <Text style={styles.warningTagText}>{warningText}</Text>
            </View>
          ) : null}
        </View>

        {isSimple ? (
          item.quantity ? (
            <Text style={styles.itemMetaLine}>数量：{item.quantity}</Text>
          ) : null
        ) : (
          <View style={styles.itemMetaBlock}>
            {item.color ? <Text style={styles.itemMetaLine}>颜色：{item.color}</Text> : null}
            {item.quantity ? <Text style={styles.itemMetaLine}>数量：{item.quantity}</Text> : null}
            {item.width ? <Text style={styles.itemMetaLine}>幅宽：{item.width}</Text> : null}
            {item.supplier ? (
              <Text style={styles.itemMetaLine}>供应商：{item.supplier}</Text>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DADEE5',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#105FC8',
    backgroundColor: '#105FC8',
  },
  itemTitleRow: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    borderRadius: 8,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    flexDirection: 'column',
    backgroundColor: '#F3F8FA',
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#021626',
    lineHeight: 22,
  },
  warningTag: {
    backgroundColor: '#FFF3E6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  warningTagText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#E67E22',
    fontWeight: '500',
  },
  itemMetaBlock: {
    gap: 2,
  },
  itemMetaLine: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7A90',
  },
});
