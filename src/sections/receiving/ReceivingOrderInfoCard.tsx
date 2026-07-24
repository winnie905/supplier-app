import { Pressable, Text } from 'design-system-native';
import { useState } from 'react';
import { Image, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import ChevronRightIcon from '@/assets/icons/chevronRight.svg';
import WarningTriangleIcon from '@/assets/icons/warningTriangle.svg';
import type { ProductionColorDetail } from '@/types/receiving';
import { resolveReceivingImage } from '@/utils/receiving/images';

interface ReceivingOrderInfoCardProps {
  detail: ProductionColorDetail;
  onPreviewImage?: (index: number) => void;
  /** 左上角警示标签文案；不传则不显示 */
  cornerTag?: string | undefined;
}

const CARD_RADIUS = 8;

const InlineField = ({
  label,
  value,
  style,
  numberOfLines = 1,
}: {
  label: string;
  value: string;
  style?: object;
  numberOfLines?: number;
}) => (
  <Text style={[styles.inlineRow, style]} numberOfLines={numberOfLines}>
    <Text style={styles.fieldLabel}>{label}：</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </Text>
);

const CardChrome = ({ width, height }: { width: number; height: number }) => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
    <Defs>
      <LinearGradient id="orderCardFill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
        <Stop offset="0.43" stopColor="#FFFFFF" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="orderCardStroke" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
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
  onPreviewImage,
  cornerTag,
}: ReceivingOrderInfoCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
          <WarningTriangleIcon color="#FFFFFF" height={12} width={12} />
          <Text style={styles.cornerTagText} numberOfLines={1}>
            {cornerTag}
          </Text>
        </View>
      ) : null}

      <View style={[styles.content, cornerTag ? styles.contentWithTag : null]}>
        <View style={styles.summary}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onPreviewImage?.(0)}
            style={styles.thumbnailWrap}
          >
            <Image source={resolveReceivingImage(detail.thumbnailUrl)} style={styles.thumbnail} />
          </Pressable>

          <View style={styles.summaryCol}>
            <View style={styles.brandRow}>
              <View style={styles.brandTag}>
                <Text style={styles.brandTagText}>品牌</Text>
              </View>
              <Text style={styles.brandName} numberOfLines={1}>
                {detail.brand}
              </Text>
            </View>
            <InlineField label="款式类别" value={detail.category} />
            <InlineField label="大货款号" value={detail.productCode} />
            <InlineField label="客户PO" value={detail.customerPO} />
            <InlineField label="要求出货日期" value={detail.requiredProductionDate} />
          </View>
        </View>

        {expanded ? (
          <View style={styles.expanded}>
            <InlineField label="设计款号" value={detail.code} />
            <InlineField label="客户款号" value={detail.customerCode} />
            <InlineField label="生产单号" value={detail.productionOrderCode} />

            <DashedDivider />

            <View style={styles.twoColRow}>
              <View style={styles.twoColLeft}>
                <InlineField label="订单类型" value={detail.orderType} />
              </View>
              <View style={styles.twoColRight}>
                <InlineField
                  label="加工方式"
                  value={detail.productionType}
                  style={styles.rightAlign}
                />
              </View>
            </View>
            <InlineField label="跟单员" value={detail.productionFollowerName} />
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
            color="#105FC8"
            style={expanded ? styles.arrowUp : undefined}
          />
        </Pressable>
      </View>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    backgroundColor: '#FD8D77',
  },
  cornerTagText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
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
    width: 72,
    height: 96,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(238, 243, 250, 0.5)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  summaryCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  brandTag: {
    backgroundColor: '#E8C4A0',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  brandTagText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#6B4423',
    fontWeight: '600',
  },
  brandName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3D4F66',
  },
  inlineRow: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7A869A',
  },
  fieldValue: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5B6B80',
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
    color: '#105FC8',
    fontWeight: '500',
  },
  arrowUp: {
    transform: [{ rotate: '180deg' }],
  },
});
