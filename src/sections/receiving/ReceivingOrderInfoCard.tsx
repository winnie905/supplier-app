import { designTokens, Pressable, Text } from 'design-system-native';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import ChevronRightIcon from '@/assets/icons/chevronRight.svg';
import WarningTriangleIcon from '@/assets/icons/warningTriangle.svg';
import { BrandBadge } from '@/components/BrandBadge';
import { OrderInfoThumbnail } from '@/components/OrderInfoThumbnail';
import { useProductCategories } from '@/hooks/apps/useProductCategories';
import { ReceivingImagePreview } from '@/sections/receiving/ReceivingImagePreview';
import type { ProductionColorDetail } from '@/types/receiving';
import { formatProductionType } from '@/utils/apps/productionType';

interface ReceivingOrderInfoCardProps {
  detail: ProductionColorDetail;
  /** 左上角警示标签文案；不传则不显示 */
  cornerTag?: string | undefined;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  /** cover：铺满裁切；contain：按原比例完整显示 */
  thumbnailFit?: 'cover' | 'contain';
}

const CARD_RADIUS = 8;

const InlineField = ({
  label,
  value,
  style,
  numberOfLines = 1,
  muted = false,
}: {
  label: string;
  value: string;
  style?: object;
  numberOfLines?: number;
  muted?: boolean;
}) => (
  <Text style={[styles.inlineRow, style]} numberOfLines={numberOfLines}>
    <Text style={[styles.fieldLabel, muted ? styles.expandedField : null]}>{label}：</Text>
    <Text style={[styles.fieldValue, muted ? styles.expandedField : null]}>{value}</Text>
  </Text>
);

const CardChrome = ({ width, height }: { width: number; height: number }) => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
    <Defs>
      <LinearGradient id="orderCardFill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
        <Stop offset="0.43" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="orderCardStroke" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
        <Stop offset="1" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Rect
      x={0.5}
      y={0.5}
      width={Math.max(width - 1, 0)}
      height={Math.max(height - 1, 0)}
      rx={CARD_RADIUS}
      ry={CARD_RADIUS}
      fill="url(#orderCardFill)"
      stroke="url(#orderCardStroke)"
      strokeWidth={1}
    />
  </Svg>
);

const DashedDivider = () => (
  <View style={styles.dashedWrap}>
    {Array.from({ length: 48 }).map((_, index) => (
      <View key={index} style={styles.dash} />
    ))}
  </View>
);

export const ReceivingOrderInfoCard = ({
  detail,
  cornerTag,
  thumbnailWidth = 80,
  thumbnailHeight = 80,
  thumbnailFit = 'contain',
}: ReceivingOrderInfoCardProps) => {
  const { getCategoryLabel } = useProductCategories();
  const [expanded, setExpanded] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const imageKeys = detail.imageUrls.length
    ? detail.imageUrls
    : detail.thumbnailUrl
      ? [detail.thumbnailUrl]
      : [];
  // 缩略图展示的是首图，预览从对应位置开始，可左右滑动看全部
  const thumbnailIndex = Math.max(
    detail.thumbnailUrl ? imageKeys.indexOf(detail.thumbnailUrl) : 0,
    0,
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={styles.card} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 ? (
        <CardChrome width={size.width} height={size.height} />
      ) : null}

      {cornerTag ? (
        <View style={styles.cornerTag}>
          <WarningTriangleIcon color={designTokens.colors.gray[0]} height={12} width={12} />
          <Text style={styles.cornerTagText} numberOfLines={1}>
            {cornerTag}
          </Text>
        </View>
      ) : null}

      <View style={[styles.content, cornerTag ? styles.contentWithTag : null]}>
        <View style={styles.summary}>
          <Pressable
            accessibilityRole="button"
            disabled={imageKeys.length === 0}
            onPress={() => setPreviewVisible(true)}
            style={[styles.thumbnailWrap, { width: thumbnailWidth, height: thumbnailHeight }]}
          >
            <OrderInfoThumbnail
              fit={thumbnailFit}
              height={thumbnailHeight}
              imageKey={detail.thumbnailUrl}
              width={thumbnailWidth}
            />
          </Pressable>

          <View style={styles.summaryCol}>
            <BrandBadge name={detail.brand} />
            <InlineField label="款式类别" value={getCategoryLabel(detail.category)} />
            <InlineField label="大货款号" value={detail.productCode} />
            <InlineField label="客户PO" value={detail.customerPO} />
            <InlineField label="要求出货日期" value={detail.requiredProductionDate} />
          </View>
        </View>

        {expanded ? (
          <View style={styles.expanded}>
            <InlineField muted label="设计款号" value={detail.code} />
            <InlineField
              muted
              label="客户款号"
              value={detail.customerCode.trim() ? detail.customerCode : '-'}
            />
            <InlineField muted label="生产单号" value={detail.productionOrderCode} />

            <DashedDivider />

            <View style={styles.twoColRow}>
              <View style={styles.twoColLeft}>
                <InlineField muted label="订单类型" value={detail.orderType} />
              </View>
              <View style={styles.twoColRight}>
                <InlineField
                  muted
                  label="加工方式"
                  value={formatProductionType(detail.productionType)}
                  style={styles.rightAlign}
                />
              </View>
            </View>
            <InlineField muted label="跟单员" value={detail.productionFollowerName} />
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((v) => !v)}
          style={styles.toggleBtn}
        >
          <Text style={styles.toggleText}>{expanded ? '收起' : '展开'}</Text>

          <ChevronRightIcon
            width={12}
            height={12}
            color={designTokens.colors.brand[500]}
            style={expanded ? styles.arrowUp : styles.arrowDown}
          />
        </Pressable>
      </View>

      <ReceivingImagePreview
        visible={previewVisible && imageKeys.length > 0}
        imageKeys={imageKeys}
        initialIndex={thumbnailIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cornerTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '88%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    backgroundColor: '#FD8D77',
  },
  cornerTagText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: designTokens.colors.gray[0],
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  contentWithTag: {
    paddingTop: 28,
  },
  summary: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnailWrap: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  inlineRow: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#0C2A52',
    fontWeight: '700',
  },
  fieldValue: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5B6B80',
  },
  expandedField: {
    color: '#6C829E',
    fontWeight: '400',
  },
  expanded: {
    marginTop: 4,
    gap: 8,
    backgroundColor: '#F5FAFF',
    padding: 12,
    borderRadius: 8,
  },
  dashedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    height: 1,
    marginVertical: 2,
    gap: 4,
  },
  dash: {
    width: 4,
    height: 1,
    backgroundColor: '#C8D4E5',
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  twoColLeft: {
    flex: 1,
    minWidth: 0,
  },
  twoColRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  rightAlign: {
    textAlign: 'right',
  },
  toggleBtn: {
    marginTop: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 13,
    color: designTokens.colors.brand[500],
    fontWeight: '500',
  },
  arrowDown: {
    transform: [{ rotate: '90deg' }],
  },
  arrowUp: {
    transform: [{ rotate: '-90deg' }],
  },
});
