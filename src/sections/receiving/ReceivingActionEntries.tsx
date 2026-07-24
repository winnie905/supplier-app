import { Image, Pressable, Text } from 'design-system-native';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

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
      } else if (status.material === 'pending') {
        meta.statusTag = { label: '待确认', tone: 'gray' };
      }
      if (status.material === 'exception') {
        meta.hasException = true;
      }
      return meta;
    }
    case 'cutting': {
      const meta: EntryMeta = {};
      if (status.cutting.cutTotal > 0) {
        meta.subtitle = `已裁: ${status.cutting.cutTotal}`;
      }
      if (status.cutting.hasException) {
        meta.hasException = true;
      }
      return meta;
    }
    case 'sewing': {
      if (status.sewing.upTotal > 0 || status.sewing.downTotal > 0) {
        return {
          subtitle: `上车位: ${status.sewing.upTotal} | 下车位: ${status.sewing.downTotal}`,
        };
      }
      return {};
    }
    case 'packing': {
      if (status.packing.boxCount > 0 || status.packing.pieceCount > 0) {
        return {
          subtitle: `总箱数: ${status.packing.boxCount} | 装箱总件数: ${status.packing.pieceCount}`,
        };
      }
      return {};
    }
    default:
      return {};
  }
};

const ExceptionPill = () => (
  <View style={styles.exceptionPill}>
    <WarningTriangleIcon color="#FFFFFF" height={14} width={14} />
    <Text style={styles.exceptionPillText}>有异常</Text>
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
            <Image source={ENTRY_ICONS[entry.key]} style={styles.icon} />
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
              {meta?.subtitle ? <Text style={styles.subtitle}>{meta.subtitle}</Text> : null}
            </View>
          </View>
          <View style={styles.right}>
            {meta?.hasException ? <ExceptionPill /> : null}
            {meta?.rightBadge ? (
              <ReceivingStatusBadge label={meta.rightBadge.label} tone={meta.rightBadge.tone} />
            ) : null}
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
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
});
