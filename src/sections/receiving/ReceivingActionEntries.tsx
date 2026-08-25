import { designTokens, Image, Pressable, Text } from 'design-system-native';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import CaretRightIcon from '@/assets/icons/caretRight.svg';
import WarningTriangleIcon from '@/assets/icons/warningTriangle.svg';
import {
  cuttingRecords,
  materialConfirmation,
  packingRecords,
  sewingRecords,
} from '@/components/images';
import {
  ACTION_ENTRIES,
  type ActionEntryKey,
  RECEIVING_ACTION_PANEL_BG,
} from '@/constants/receiving';
import { ReceivingStatusBadge } from '@/sections/receiving/ReceivingStatusBadge';
import type { ProductionColorSummary } from '@/types/receiving';

const ENTRY_ICONS: Record<ActionEntryKey, ImageSourcePropType> = {
  material: materialConfirmation,
  cutting: cuttingRecords,
  sewing: sewingRecords,
  packing: packingRecords,
};

interface EntryMeta {
  statusTag?: { label: string; tone: 'blue' | 'gray' | 'green' };
  subtitle?: string;
  rightBadge?: { label: string; tone: 'red' | 'orange' | 'green' };
  hasException?: boolean;
}

const getEntryMeta = (key: ActionEntryKey, summary: ProductionColorSummary): EntryMeta => {
  if (summary.status === 'completed') {
    return { rightBadge: { label: '已完成', tone: 'green' } };
  }

  const status = summary.moduleStatus;
  switch (key) {
    case 'material': {
      const meta: EntryMeta = {};
      if (status.material === 'all_arrived') {
        meta.statusTag = { label: '全部到料', tone: 'blue' };
      } else if (status.material === 'partial' || status.material === 'exception') {
        meta.statusTag = { label: '部分到料', tone: 'blue' };
      }
      // pending（未开始）不展示「待确认」
      if (status.material === 'exception') {
        meta.hasException = true;
      }
      return meta;
    }
    case 'cutting': {
      const meta: EntryMeta = {};
      if (status.cutting.cutTotal > 0) {
        meta.subtitle = `已裁：${status.cutting.cutTotal}`;
      }
      if (status.cutting.hasException) {
        meta.hasException = true;
      }
      return meta;
    }
    case 'sewing': {
      if (status.sewing.upTotal > 0 || status.sewing.downTotal > 0) {
        return {
          subtitle: `上车位：${status.sewing.upTotal} | 下车位：${status.sewing.downTotal}`,
        };
      }
      return {};
    }
    case 'packing': {
      if (status.packing.boxCount > 0 || status.packing.pieceCount > 0) {
        return {
          subtitle: `总箱数：${status.packing.boxCount} | 装箱总件数：${status.packing.pieceCount}`,
        };
      }
      return {};
    }
    default:
      return {};
  }
};

/** 已回填生产单、但该入口尚无实质处理数据时，右侧展示「去完成」 */
const shouldShowGoComplete = (meta: EntryMeta | null, isCompleted: boolean) => {
  if (!meta || isCompleted) return false;
  if (meta.hasException || meta.rightBadge || meta.subtitle) return false;
  // 全部/部分到料等状态标签视为已有处理进度
  if (meta.statusTag) return false;
  return true;
};

/** 设计稿：数量文案用中等灰，竖线分隔符更浅 */
const EntrySubtitle = ({ text }: { text: string }) => {
  const parts = text.split(' | ');
  if (parts.length === 1) {
    return <Text style={styles.subtitle}>{text}</Text>;
  }
  return (
    <Text style={styles.subtitle}>
      {parts.map((part, index) => (
        <Text key={`${part}-${index}`}>
          {index > 0 ? <Text style={styles.subtitleDivider}>{' | '}</Text> : null}
          {part}
        </Text>
      ))}
    </Text>
  );
};

const ExceptionPill = () => (
  <View style={styles.exceptionPill}>
    <WarningTriangleIcon color={designTokens.colors.gray[0]} height={14} width={14} />
    <Text style={styles.exceptionPillText}>有异常</Text>
  </View>
);

/** 仅作视觉提示，点击由整卡 Pressable 承接 */
const GoCompletePill = () => (
  <View pointerEvents="none" style={styles.goCompletePill}>
    <Text style={styles.goCompleteText}>去完成</Text>
    <CaretRightIcon color="#061B37" height={12} width={12} />
  </View>
);

interface ReceivingActionEntriesProps {
  summary?: ProductionColorSummary | null;
  disabled?: boolean;
  onPressEntry: (key: ActionEntryKey) => void;
  onDisabledPress?: () => void;
}

export const ReceivingActionEntries = ({
  summary,
  disabled,
  onPressEntry,
  onDisabledPress,
}: ReceivingActionEntriesProps) => (
  <View style={styles.wrap}>
    {ACTION_ENTRIES.map((entry) => {
      const meta = summary ? getEntryMeta(entry.key, summary) : null;
      const isCompleted = summary?.status === 'completed';
      const showGoComplete = Boolean(summary) && shouldShowGoComplete(meta, Boolean(isCompleted));

      return (
        <Pressable
          key={entry.key}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => {
            if (disabled) {
              onDisabledPress?.();
              return;
            }
            if (isCompleted) return;
            onPressEntry(entry.key);
          }}
          style={[styles.item, disabled && styles.itemDisabled]}
        >
          <View style={styles.left}>
            <Image
              source={ENTRY_ICONS[entry.key]}
              style={[styles.icon, disabled && styles.iconDisabled]}
            />
            <View style={styles.textCol}>
              <Text style={[styles.title, disabled && styles.itemDisabledTitle]}>
                {entry.title}
              </Text>
              {meta?.statusTag ? (
                <ReceivingStatusBadge
                  compact
                  label={meta.statusTag.label}
                  tone={meta.statusTag.tone}
                />
              ) : null}
              {meta?.subtitle ? <EntrySubtitle text={meta.subtitle} /> : null}
            </View>
          </View>
          <View style={styles.right}>
            {meta?.hasException ? <ExceptionPill /> : null}
            {meta?.rightBadge ? (
              <ReceivingStatusBadge label={meta.rightBadge.label} tone={meta.rightBadge.tone} />
            ) : null}
            {showGoComplete ? <GoCompletePill /> : null}
          </View>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
  },
  item: {
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: designTokens.colors.gray[0],
    paddingHorizontal: 13,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDisabled: {
    backgroundColor: '#E8EEF5',
  },
  itemDisabledTitle: {
    color: '#9AADBF',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  icon: {
    height: 54,
    width: 54,
  },
  iconDisabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#021626',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7A90',
  },
  subtitleDivider: {
    color: '#C5CDD8',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  exceptionPill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FD8D77',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  exceptionPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: designTokens.colors.gray[0],
  },
  goCompletePill: {
    width: 86,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 53,
    borderWidth: 1,
    borderColor: '#C8DFFF',
    backgroundColor: '#F3F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goCompleteText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#061B37',
  },
});
