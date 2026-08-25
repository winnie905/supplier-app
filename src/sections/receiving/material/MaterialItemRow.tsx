import { designTokens } from 'design-system-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import CheckIcon from '@/assets/icons/check.svg';
import WarningTriangleIcon from '@/assets/icons/warningTriangle.svg';
import { ReceivingStatusBadge } from '@/sections/receiving/ReceivingStatusBadge';
import type { MaterialItem, MaterialItemStatus } from '@/types/receiving';

const PRIMARY_STATUS: MaterialItemStatus[] = ['pending', 'arrived'];

const STATUS_BADGE: Record<'pending' | 'arrived', { label: string; tone: 'blue' | 'green' }> = {
  pending: { label: '待确认', tone: 'blue' },
  arrived: { label: '已到料', tone: 'green' },
};

/** 数量/幅宽展示：数值 + 接口单位（单位已含在数值里则不重复拼） */
const formatMeasure = (value: string, unit?: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const unitLabel = unit?.trim();
  if (!unitLabel || trimmed.endsWith(unitLabel)) return trimmed;
  return `${trimmed}${unitLabel}`;
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
    {checked ? <CheckIcon color={designTokens.colors.gray[0]} height={10} width={10} /> : null}
  </View>
);

export const MaterialItemCard = ({
  item,
  checked,
  onToggle,
  exceptionLabel,
}: {
  item: MaterialItem;
  checked: boolean;
  onToggle: () => void;
  /** 待回复异常类型文案，如「缺料、质量问题」 */
  exceptionLabel?: string;
}) => {
  const primary =
    item.statuses.find((s): s is 'pending' | 'arrived' => PRIMARY_STATUS.includes(s)) ?? 'pending';
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
          Boolean(exceptionLabel) && styles.itemTitleRowWithException,
        ]}
      >
        {exceptionLabel ? (
          <View style={styles.warningTagCorner}>
            <WarningTriangleIcon color={designTokens.colors.gray[0]} height={12} width={12} />
            <Text style={styles.warningTagText} numberOfLines={1}>
              {exceptionLabel}
            </Text>
          </View>
        ) : null}

        <View style={[styles.itemNameRow, isPackaging && styles.itemNameRowCompact]}>
          <ReceivingStatusBadge
            compact
            outline
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
                      数量：{formatMeasure(item.quantity, item.unit)}
                    </Text>
                  ) : (
                    <View style={styles.fabricQtyWidthCol} />
                  )}
                  {item.width ? (
                    <Text
                      style={[
                        styles.fabricMetaLine,
                        styles.fabricQtyWidthCol,
                        styles.fabricWidthAlign,
                      ]}
                    >
                      幅宽：{formatMeasure(item.width, item.unit)}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}
            {item.supplier ? (
              <>
                <FabricDashedDivider />
                <Text style={[styles.fabricMetaLine, styles.fabricSupplierLine]}>
                  供应商：{item.supplier}
                </Text>
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
    borderColor: designTokens.colors.gray[200],
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designTokens.colors.gray[0],
  },
  checkboxChecked: {
    borderColor: designTokens.colors.brand[500],
    backgroundColor: designTokens.colors.brand[500],
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
    overflow: 'hidden',
  },
  itemTitleRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 12,
  },
  itemTitleRowFabric: {
    gap: 0,
    paddingTop: 12,
    paddingBottom: 12,
  },
  itemTitleRowWithException: {
    paddingRight: 16,
    paddingTop: 16,
  },
  warningTagCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FD8D77',
    borderBottomLeftRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  warningTagText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: designTokens.colors.gray[0],
    fontWeight: '500',
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
  fabricSupplierLine: {
    paddingBottom: 0,
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
  fabricWidthAlign: {
    textAlign: 'right',
  },
  itemMetaLine: {
    fontSize: 14,
    lineHeight: 18,
    color: '#6B7A90',
    flexShrink: 0,
  },
});
