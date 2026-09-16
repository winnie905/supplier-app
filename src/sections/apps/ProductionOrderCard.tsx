import { designTokens, Pressable, Tag, Text } from 'design-system-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ChevronRightIcon from '@/assets/icons/chevronRight.svg';
import OrderStatusIcon from '@/assets/icons/orderStatus.svg';
import { BrandBadge } from '@/components/BrandBadge';
import { OrderInfoThumbnail } from '@/components/OrderInfoThumbnail';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatUserName } from '@/services/receiving/mapReceivingHelpers';
import { useCareModeStore } from '@/store/careModeStore';
import type {
  ProductionColorProgressStatus,
  ProductionOrderAggregateStatus,
  ProductionOrderView,
} from '@/types/apps';
import { mapProductionStatusToProgress } from '@/types/apps';
import { formatProductionType } from '@/utils/apps/productionType';
import { toDateOnly } from '@/utils/date';
import { formatCount } from '@/utils/number';

interface ProductionOrderCardProps {
  order: ProductionOrderView;
  /** 仅在超期 Tab 下展示「超期」角标 */
  showOverdueBadge?: boolean;
  /** 第二行款式类别展示文案（已按 getSystemConfig.categories 映射） */
  categoryLabel?: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onColorPress: (ref: { productionOrderCode: string; color: string }) => void;
}

const ORDER_STATUS_LABEL: Record<ProductionOrderAggregateStatus, string> = {
  pending: '待生产',
  in_progress: '生产中',
  completed: '已完成',
};

const COLOR_STATUS_LABEL: Record<ProductionColorProgressStatus, string> = {
  ordered: '待生产',
  in_progress: '生产中',
  partial: '部分完成',
  completed: '已完成',
};

const ORDER_STATUS_BADGE: Record<ProductionOrderAggregateStatus, string> = {
  pending: '#FAC368',
  in_progress: '#56A1E8',
  completed: designTokens.colors.success,
};

const OVERDUE_BADGE_COLOR = '#FF8789';

const COLOR_STATUS_TAG: Record<
  ProductionColorProgressStatus,
  { backgroundColor: string; textColor: string }
> = {
  ordered: { backgroundColor: '#FFF3E6', textColor: '#FF8A3D' },
  in_progress: { backgroundColor: '#E8F1FC', textColor: designTokens.colors.brand[500] },
  partial: { backgroundColor: '#E8F1FC', textColor: designTokens.colors.brand[500] },
  completed: { backgroundColor: '#E8F8EF', textColor: designTokens.colors.success },
};

const formatDate = (value: string) => toDateOnly(value);

/** summary：卡片主信息区；detail：展开后的补充信息区 */
const FieldRow = ({
  label,
  value,
  variant = 'summary',
  align = 'left',
}: {
  label: string;
  value: string;
  variant?: 'summary' | 'detail';
  align?: 'left' | 'right';
}) => {
  const detail = variant === 'detail';
  return (
    <Text
      style={[styles.fieldRow, align === 'right' ? styles.fieldRowRight : null]}
      numberOfLines={1}
    >
      <Text style={detail ? styles.detailLabel : styles.fieldLabel}>{label}：</Text>
      <Text style={detail ? styles.detailValue : styles.fieldValue}>{value}</Text>
    </Text>
  );
};

export const ProductionOrderCard = memo(function ProductionOrderCard({
  order,
  showOverdueBadge = false,
  categoryLabel,
  expanded,
  onToggleExpand,
  onColorPress,
}: ProductionOrderCardProps) {
  const { colors } = useAppTheme();
  const careModeEnabled = useCareModeStore((state) => state.enabled);
  const showOverdue = showOverdueBadge && order.overdue;
  const badgeColor = showOverdue ? OVERDUE_BADGE_COLOR : ORDER_STATUS_BADGE[order.status];
  const badgeLabel = showOverdue ? '超期' : ORDER_STATUS_LABEL[order.status];
  const { representative } = order;
  const cpo = representative.customerPurchaseOrder;
  const thumbnailUrl = representative.template?.frontImages?.[0]?.url;
  const merchandiser = formatUserName(cpo.productionFollower);
  const categoryText = categoryLabel ?? representative.templateDesign.category;

  return (
    <View style={styles.card}>
      <View style={[styles.statusBadge, careModeEnabled ? styles.statusBadgeCare : null]}>
        <OrderStatusIcon
          width={careModeEnabled ? 82 : 67}
          height={careModeEnabled ? 24 : 20}
          color={badgeColor}
        />
        <Text style={[styles.statusBadgeText, careModeEnabled ? styles.statusBadgeTextCare : null]}>
          {badgeLabel}
        </Text>
      </View>

      <View style={styles.header}>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <View style={styles.headerMain}>
          <Text style={styles.title} numberOfLines={1}>
            {cpo.productCode}
          </Text>
          {categoryText ? (
            <Text style={styles.category} numberOfLines={1}>
              {categoryText}
            </Text>
          ) : null}
        </View>
        <Text style={styles.summary} numberOfLines={1}>
          {order.colorCount}色 | 总量:{formatCount(order.totalQty)}件
        </Text>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.body}>
        <View style={styles.summaryBlock}>
          <OrderInfoThumbnail fit="contain" height={80} imageKey={thumbnailUrl} width={80} />
          <View style={styles.summaryInfo}>
            <FieldRow label="客户PO" value={cpo.customerPO} />
            <FieldRow label="最后交期" value={formatDate(order.lastDeliveryDate)} />
            <BrandBadge name={cpo.brand.name} />
            {!expanded ? (
              <Pressable
                accessibilityRole="button"
                onPress={onToggleExpand}
                style={styles.toggle}
                hitSlop={16}
              >
                <Text style={styles.toggleText}>展开</Text>
                <ChevronRightIcon
                  color={designTokens.colors.brand[500]}
                  height={12}
                  width={12}
                  style={styles.toggleIconDown}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        {expanded ? (
          <>
            <View style={styles.expanded}>
              <FieldRow label="设计款号" value={cpo.code} variant="detail" />
              <FieldRow
                label="客户款号"
                value={
                  representative.templateDesign.customerCode.trim()
                    ? representative.templateDesign.customerCode
                    : '-'
                }
                variant="detail"
              />
              <FieldRow label="生产单号" value={order.productionOrderCode} variant="detail" />
              <View style={styles.expandedDivider} />
              <View style={styles.twoCol}>
                <View style={styles.twoColItem}>
                  <FieldRow label="订单类型" value={representative.orderType} variant="detail" />
                </View>
                <View style={styles.twoColItem}>
                  <FieldRow
                    align="right"
                    label="加工方式"
                    value={formatProductionType(representative.productionType)}
                    variant="detail"
                  />
                </View>
              </View>
              <FieldRow label="跟单员" value={merchandiser} variant="detail" />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onToggleExpand}
              style={styles.toggleCollapse}
              hitSlop={16}
            >
              <Text style={styles.toggleText}>收起</Text>
              <ChevronRightIcon
                color={designTokens.colors.brand[500]}
                height={12}
                width={12}
                style={styles.toggleIconUp}
              />
            </Pressable>
          </>
        ) : null}

        <View style={styles.colorList}>
          {order.items.map((item) => {
            const progress = mapProductionStatusToProgress(item.status);
            return (
              <Pressable
                key={`${order.productionOrderCode}::${item.color}`}
                accessibilityRole="button"
                onPress={() =>
                  onColorPress({
                    productionOrderCode: order.productionOrderCode,
                    color: item.color,
                  })
                }
                style={styles.colorRow}
              >
                <View style={styles.colorContent}>
                  <View style={styles.colorMain}>
                    <Text style={styles.colorName}>{item.color}</Text>
                    <Tag
                      color={COLOR_STATUS_TAG[progress]}
                      style={styles.colorStatus}
                      textStyle={styles.colorStatusText}
                      variant="outline"
                    >
                      {COLOR_STATUS_LABEL[progress]}
                    </Tag>
                  </View>
                  <Text style={styles.colorDate}>
                    要求交期：{formatDate(item.customerPurchaseOrder.requiredProductionDate)}
                  </Text>
                </View>
                <ChevronRightIcon color="#6C829E" height={16} width={16} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: designTokens.colors.gray[0],
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    width: 67,
    height: 20,
  },
  statusBadgeText: {
    ...StyleSheet.absoluteFillObject,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    color: designTokens.colors.gray[0],
    includeFontPadding: false,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 21,
    paddingRight: 10,
  },
  statusBadgeCare: {
    width: 82,
    height: 24,
  },
  statusBadgeTextCare: {
    lineHeight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 26,
    paddingRight: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingRight: 12,
    gap: 8,
  },
  accent: {
    width: 4,
    height: 20,
  },
  headerDivider: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BCD4F4',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#021626',
  },
  summary: {
    flexShrink: 0,
    fontSize: 14,
    color: '#6C829E',
  },
  category: {
    fontSize: 14,
    color: '#415570',
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  summaryBlock: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  fieldRow: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldRowRight: {
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 15,
    color: '#0C2A52',
  },
  fieldValue: {
    fontSize: 15,
    color: '#50637B',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C829E',
  },
  detailValue: {
    fontSize: 14,
    color: '#6C829E',
  },
  toggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  toggleCollapse: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: 13,
    color: designTokens.colors.brand[500],
  },
  toggleIconDown: {
    transform: [{ rotate: '90deg' }],
  },
  toggleIconUp: {
    transform: [{ rotate: '-90deg' }],
  },
  expanded: {
    gap: 8,
    backgroundColor: '#F5FAFF',
    borderRadius: 8,
    padding: 12,
  },
  expandedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E5',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  twoColItem: {
    flex: 1,
    minWidth: 0,
  },
  colorList: {
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6FAFC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#90B5E7',
  },
  colorContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  colorMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#061B37',
  },
  colorStatus: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  colorDate: {
    fontSize: 14,
    color: '#6C829E',
  },
});
