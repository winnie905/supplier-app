import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

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

/** 面辅料虚线：4 实 + 4 空，色 #BCD4F4、粗细 1 */
const FabricDashedDivider = () => (
  <View style={styles.dashedWrap}>
    <Svg height={1} width="100%">
      <Line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="#BCD4F4"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
    </Svg>
  </View>
);

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
  const isPackaging = item.category === 'packaging';
  const isFabric = item.category === 'fabric';
  const isDataPackage = item.category === 'data_package';

  return (
    <Pressable accessibilityRole="checkbox" onPress={onToggle} style={styles.itemCard}>
      <CircleCheck checked={checked} />
      <View
        style={[
          styles.itemTitleRow,
          isPackaging && styles.itemTitleRowHorizontal,
          isFabric && styles.itemTitleRowFabric,
        ]}
      >
        {(isPackaging || isFabric) && warningText ? (
          <View style={styles.warningTagCorner}>
            <Text style={styles.warningTagText}>{warningText}</Text>
          </View>
        ) : null}

        <View style={[styles.itemNameRow, isPackaging && styles.itemNameRowCompact]}>
          <ReceivingStatusBadge
            compact
            label={STATUS_BADGE[primary].label}
            tone={STATUS_BADGE[primary].tone}
          />
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {isPackaging ? <Text style={styles.itemMetaLine}>数量：要求足量</Text> : null}

        {isDataPackage && item.quantity ? (
          <Text style={styles.itemMetaLine}>数量：{item.quantity}</Text>
        ) : null}

        {isFabric ? (
          <>
            {item.color ? (
              <>
                <FabricDashedDivider />
                <Text style={styles.fabricMetaLine}>颜色：{item.color}</Text>
              </>
            ) : null}
            {item.quantity || item.width ? (
              <>
                <FabricDashedDivider />
                <View style={styles.fabricQtyWidthRow}>
                  {item.quantity ? (
                    <Text style={[styles.fabricMetaLine, styles.fabricQtyWidthCol]}>
                      数量：{item.quantity}
                    </Text>
                  ) : (
                    <View style={styles.fabricQtyWidthCol} />
                  )}
                  {item.width ? (
                    <Text style={[styles.fabricMetaLine, styles.fabricQtyWidthCol]}>
                      幅宽：{item.width}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}
            {item.supplier ? (
              <>
                <FabricDashedDivider />
                <Text style={styles.fabricMetaLine}>供应商：{item.supplier}</Text>
              </>
            ) : null}
          </>
        ) : null}
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
  itemTitleRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  itemTitleRowFabric: {
    gap: 0,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 10,
  },
  itemNameRowCompact: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingBottom: 0,
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#021626',
    lineHeight: 22,
  },
  warningTagCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: '#FFF3E6',
    borderBottomLeftRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  warningTagText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#E67E22',
    fontWeight: '500',
  },
  dashedWrap: {
    alignSelf: 'stretch',
    height: 1,
    overflow: 'hidden',
  },
  fabricMetaLine: {
    fontSize: 14,
    lineHeight: 18,
    color: '#6B7A90',
    paddingVertical: 8,
  },
  fabricQtyWidthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  fabricQtyWidthCol: {
    flex: 1,
    minWidth: 0,
  },
  itemMetaLine: {
    fontSize: 14,
    lineHeight: 18,
    color: '#6B7A90',
    flexShrink: 0,
  },
});
