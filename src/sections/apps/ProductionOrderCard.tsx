import { Pressable, Text } from 'design-system-native';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import ChevronRightIcon from '@/assets/icons/chevronRight.svg';
import OrderStatusIcon from '@/assets/icons/orderStatus.svg';
import { Tag } from '@/components/Tag';
import type {
  ProductionColorProgressStatus,
  ProductionOrderAggregateStatus,
  ProductionOrderView,
} from '@/types/apps';
import { mapProductionStatusToProgress } from '@/types/apps';
import { resolveReceivingImage } from '@/utils/receiving/images';

interface ProductionOrderCardProps {
  order: ProductionOrderView;
  expanded: boolean;
  onToggleExpand: () => void;
  onColorPress: (productionColorId: string) => void;
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

const ORDER_ACCENT: Record<ProductionOrderAggregateStatus, string> = {
  pending: '#FAC368',
  in_progress: '#56A1E8',
  completed: '#1A9F5C',
};

const ORDER_STATUS_BADGE: Record<ProductionOrderAggregateStatus, string> = {
  pending: '#FAC368',
  in_progress: '#56A1E8',
  completed: '#1A9F5C',
};

const OVERDUE_BADGE_COLOR = '#FF8789';

const COLOR_STATUS_TAG: Record<
  ProductionColorProgressStatus,
  { backgroundColor: string; textColor: string }
> = {
  ordered: { backgroundColor: '#FFF3E6', textColor: '#FF8A3D' },
  in_progress: { backgroundColor: '#E8F1FC', textColor: '#105FC8' },
  partial: { backgroundColor: '#E8F1FC', textColor: '#105FC8' },
  completed: { backgroundColor: '#E8F8EF', textColor: '#1A9F5C' },
};

const formatDate = (value: string) => value;

const formatCount = (value: number) => value.toLocaleString('en-US');

const displayFollowerName = (firstName: string, lastName: string, username: string) =>
  [lastName, firstName].filter(Boolean).join('') || username;

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Text style={styles.fieldRow} numberOfLines={1}>
    <Text style={styles.fieldLabel}>{label}：</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </Text>
);

export const ProductionOrderCard = memo(function ProductionOrderCard({
  order,
  expanded,
  onToggleExpand,
  onColorPress,
}: ProductionOrderCardProps) {
  const accent = order.overdue ? OVERDUE_BADGE_COLOR : ORDER_ACCENT[order.status];
  const badgeColor = order.overdue ? OVERDUE_BADGE_COLOR : ORDER_STATUS_BADGE[order.status];
  const badgeLabel = order.overdue ? '超期' : ORDER_STATUS_LABEL[order.status];
  const { representative } = order;
  const cpo = representative.customerPurchaseOrder;
  const thumbnailUrl = representative.templateDesign.designImageUrls[0];
  const merchandiser = displayFollowerName(
    cpo.productionFollower.firstName,
    cpo.productionFollower.lastName,
    cpo.productionFollower.username,
  );

  return (
    <View style={styles.card}>
      <View style={styles.statusBadge}>
        <OrderStatusIcon width={67} height={20} color={badgeColor} />
        <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
      </View>

      <View style={styles.header}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.headerMain}>
          <Text style={styles.title} numberOfLines={1}>
            {cpo.productCode}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {representative.templateDesign.category}
          </Text>
        </View>
        <Text style={styles.summary} numberOfLines={1}>
          {order.colorCount}色 | 总量:{formatCount(order.totalQty)}件
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.summaryBlock}>
          <Image source={resolveReceivingImage(thumbnailUrl)} style={styles.thumbnail} />
          <View style={styles.summaryInfo}>
            <FieldRow label="客户PO" value={cpo.customerPO} />
            <FieldRow label="最后交期" value={formatDate(order.lastDeliveryDate)} />
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>品牌 {cpo.brand.name}</Text>
            </View>
            {!expanded ? (
              <Pressable
                accessibilityRole="button"
                onPress={onToggleExpand}
                style={styles.toggle}
                hitSlop={16}
              >
                <Text style={styles.toggleText}>展开</Text>
                <ChevronRightIcon
                  color="#105FC8"
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
              <FieldRow label="设计款号" value={cpo.code} />
              <FieldRow label="客户款号" value={representative.templateDesign.customerCode} />
              <FieldRow label="生产单号" value={order.productionOrderCode} />
              <View style={styles.twoCol}>
                <View style={styles.twoColItem}>
                  <FieldRow label="订单类型" value={representative.orderType} />
                </View>
                <View style={styles.twoColItem}>
                  <FieldRow label="加工方式" value={representative.productionType} />
                </View>
              </View>
              <FieldRow label="跟单员" value={merchandiser} />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onToggleExpand}
              style={styles.toggleCollapse}
              hitSlop={16}
            >
              <Text style={styles.toggleText}>收起</Text>
              <ChevronRightIcon
                color="#105FC8"
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
                key={item.id}
                accessibilityRole="button"
                onPress={() => onColorPress(String(item.id))}
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
    backgroundColor: '#FFFFFF',
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
    lineHeight: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    includeFontPadding: false,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 21,
    paddingRight: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingRight: 12,
    paddingBottom: 10,
    gap: 8,
  },
  accent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginLeft: 12,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
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
  thumbnail: {
    width: 72,
    height: 96,
    borderRadius: 4,
    backgroundColor: '#EEF3FA',
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
  fieldLabel: {
    fontSize: 15,
    color: '#7A869A',
  },
  fieldValue: {
    fontSize: 15,
    color: '#3D4F66',
  },
  brandTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E0CC',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  brandTagText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#C47A3A',
    fontWeight: '600',
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
    color: '#105FC8',
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
