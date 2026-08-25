import { designTokens } from 'design-system-native';
import { type ReactNode, useState } from 'react';
import { Image, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { receivingCardDecorImage } from '@/components/images';
import { CircleCheck, MaterialItemCard } from '@/sections/receiving/material/MaterialItemRow';
import type { MaterialCategory, MaterialItem } from '@/types/receiving';

const SECTION_CARD_RADIUS = 18;

interface SectionGradientTheme {
  angleDeg: number;
  startColor: string;
  startOpacity: number;
  startOffset: number;
  endColor: string;
  endOpacity: number;
  endOffset: number;
}

const SECTION_GRADIENTS: Record<MaterialCategory, SectionGradientTheme> = {
  // linear-gradient(98deg, #c9e0fc00 0%, #b7d7ff 81%)
  fabric: {
    angleDeg: 98,
    startColor: '#C9E0FC',
    startOpacity: 0,
    startOffset: 0,
    endColor: '#B7D7FF',
    endOpacity: 1,
    endOffset: 0.81,
  },
  // linear-gradient(94deg, #e2eaff 0%, #bacafc 94%)
  packaging: {
    angleDeg: 94,
    startColor: '#E2EAFF',
    startOpacity: 1,
    startOffset: 0,
    endColor: '#BACAFC',
    endOpacity: 1,
    endOffset: 0.94,
  },
  // linear-gradient(94deg, #deeff4de 0%, #cbeff4 95%)
  data_package: {
    angleDeg: 94,
    startColor: '#DEEFF4',
    startOpacity: 0xde / 0xff,
    startOffset: 0,
    endColor: '#CBEFF4',
    endOpacity: 1,
    endOffset: 0.95,
  },
};

const cssAngleToSvgEndpoints = (angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.sin(rad);
  const y = -Math.cos(rad);
  return {
    x1: 0.5 - x / 2,
    y1: 0.5 - y / 2,
    x2: 0.5 + x / 2,
    y2: 0.5 + y / 2,
  };
};

const SectionCardChrome = ({
  width,
  height,
  gradientId,
  theme,
  mode,
}: {
  width: number;
  height: number;
  gradientId: string;
  theme: SectionGradientTheme;
  mode: 'fill' | 'stroke';
}) => {
  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;
  const { x1, y1, x2, y2 } = cssAngleToSvgEndpoints(theme.angleDeg);
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {mode === 'fill' ? (
          <LinearGradient id={fillId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop
              offset={theme.startOffset}
              stopColor={theme.startColor}
              stopOpacity={theme.startOpacity}
            />
            <Stop
              offset={theme.endOffset}
              stopColor={theme.endColor}
              stopOpacity={theme.endOpacity}
            />
          </LinearGradient>
        ) : (
          <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={designTokens.colors.gray[0]} stopOpacity="1" />
            <Stop offset="0.99" stopColor={designTokens.colors.gray[0]} stopOpacity="0" />
          </LinearGradient>
        )}
      </Defs>
      <Rect
        x={0.5}
        y={0.5}
        width={Math.max(width - 1, 0)}
        height={Math.max(height - 1, 0)}
        rx={SECTION_CARD_RADIUS}
        ry={SECTION_CARD_RADIUS}
        fill={mode === 'fill' ? `url(#${fillId})` : 'none'}
        stroke={mode === 'stroke' ? `url(#${strokeId})` : 'none'}
        strokeWidth={mode === 'stroke' ? 1 : 0}
      />
    </Svg>
  );
};

const SectionCard = ({
  category,
  onLayout,
  children,
}: {
  category: MaterialCategory;
  onLayout: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const theme = SECTION_GRADIENTS[category];
  const gradientId = `section-${category}`;

  return (
    <View
      style={styles.sectionCard}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
        onLayout(event);
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <SectionCardChrome
          gradientId={gradientId}
          mode="fill"
          theme={theme}
          width={size.width}
          height={size.height}
        />
      ) : null}
      {/* 装饰图在描边之下，并由 overflow:hidden 裁切超出卡片的部分 */}
      <View pointerEvents="none" style={styles.sectionCardDecorWrap}>
        <Image source={receivingCardDecorImage} style={styles.sectionCardDecor} />
      </View>
      {size.width > 0 && size.height > 0 ? (
        <SectionCardChrome
          gradientId={gradientId}
          mode="stroke"
          theme={theme}
          width={size.width}
          height={size.height}
        />
      ) : null}
      {children}
    </View>
  );
};

interface MaterialCategorySectionProps {
  category: MaterialCategory;
  title: string;
  groups: [string, MaterialItem[]][];
  sectionChecked: boolean;
  selectedIds: string[];
  exceptionLabelByItemId?: Record<string, string>;
  onToggleSection: () => void;
  onToggleItem: (id: string) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const MaterialCategorySection = ({
  category,
  title,
  groups,
  sectionChecked,
  selectedIds,
  exceptionLabelByItemId,
  onToggleSection,
  onToggleItem,
  onLayout,
}: MaterialCategorySectionProps) => (
  <SectionCard category={category} onLayout={onLayout}>
    <Pressable accessibilityRole="checkbox" onPress={onToggleSection} style={styles.sectionHeader}>
      <CircleCheck checked={sectionChecked} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Pressable>

    <View style={styles.sectionContent}>
      {groups.map(([groupName, groupItems]) => (
        <View key={groupName} style={styles.groupBlock}>
          {category === 'fabric' ? <Text style={styles.groupTitle}>{groupName}：</Text> : null}
          {groupItems.map((item) => (
            <MaterialItemCard
              key={item.id}
              item={item}
              checked={selectedIds.includes(item.id)}
              {...(exceptionLabelByItemId?.[item.id]
                ? { exceptionLabel: exceptionLabelByItemId[item.id] }
                : null)}
              onToggle={() => onToggleItem(item.id)}
            />
          ))}
        </View>
      ))}
    </View>
  </SectionCard>
);

const styles = StyleSheet.create({
  sectionCard: {
    alignSelf: 'stretch',
    borderRadius: SECTION_CARD_RADIUS,
    paddingTop: 12,
    gap: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionCardDecorWrap: {
    position: 'absolute',
    right: 29,
    top: -44,
    width: 142,
    height: 123,
  },
  sectionCardDecor: {
    width: 142,
    height: 123,
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#021626',
  },
  groupBlock: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A90',
  },
  sectionContent: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    flexDirection: 'column',
    backgroundColor: designTokens.colors.gray[0],
  },
});
