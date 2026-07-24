import { useHeaderHeight } from '@react-navigation/elements';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import EditIcon from '@/assets/icons/edit.svg';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { useToast } from '@/components/toast/Toast';
import { useDebouncedPersist } from '@/hooks/receiving/useDebouncedPersist';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import { useExpandableRecordList } from '@/hooks/receiving/useExpandableRecordList';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { useProductionColorDetail, useSewingRecords } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import {
  receivingService,
  sumQuantities,
  todayString,
} from '@/services/receiving/receivingService';
import type { SewingDayRecord, SizeQuantity } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';

type SewingRecordsPageProps = LogisticsScreenProps<'SewingRecords'>;

const formatDateTitle = (date: string) => date.replace(/-/g, '/');

const toDetailItems = (sizes: string[], values: SizeQuantity[]) =>
  sizes.map((size) => ({
    key: size,
    label: size,
    value: values.find((item) => item.size === size)?.quantity ?? 0,
  }));

export const SewingRecordsPage = ({ route }: SewingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast } = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useSewingRecords(productionColorId);
  const { scrollRef, onInputFocus, onScroll, contentBottomInset, rootKeyboardInset } =
    useKeyboardAwareScroll();
  const {
    expandedIds,
    editingId,
    setEditingId,
    toggleExpand,
    ensureExpanded,
    initExpandFirst,
    collapseToFirst,
  } = useExpandableRecordList();

  const [records, setRecords] = useState<SewingDayRecord[]>([]);

  const sizes = data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []);
  const today = data?.today ?? todayString();

  const { schedule: schedulePersist, flush: flushPersist } = useDebouncedPersist(
    async (next: SewingDayRecord[]) => {
      await receivingService.saveSewingRecords(productionColorId, next);
    },
  );

  useEffect(() => {
    if (!data?.records) return;
    const sorted = [...data.records].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(sorted);

    if (sorted.length > 0) {
      const first = sorted[0]!;
      initExpandFirst(first.id, !first.submitted);
    }
  }, [data, initExpandFirst]);

  const persist = (next: SewingDayRecord[]) => {
    setRecords(next);
    schedulePersist(next);
  };

  const updateRecord = (id: string, patch: Partial<SewingDayRecord>) => {
    const next = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
    persist(next);
  };

  const handleSubmit = () => {
    void runSubmit(async () => {
      await flushPersist();
      const targets = records.filter((record) => !record.submitted || record.id === editingId);
      if (targets.length === 0) {
        showToast('没有可提交的记录', { duration: 3000 });
        return;
      }
      try {
        const targetIds = targets.map((record) => record.id);
        await receivingService.submitSewingRecords(productionColorId, records, targetIds);
        setEditingId(undefined);
        collapseToFirst(records[0]?.id);
        await refresh();
        showToast('提交成功', { duration: 3000 });
      } catch (error) {
        if (error instanceof Error && error.message === 'EMPTY_FORM') {
          showToast('不能提交空白表单！', { duration: 3000 });
        }
      }
    });
  };

  const totals = useMemo(() => {
    const todayRecord = records.find((r) => r.date === today);
    const submitted = records.filter((r) => r.submitted);
    const downTotal = submitted.reduce((sum, r) => sum + sumQuantities(r.downQuantities), 0);
    const todayUp = todayRecord ? sumQuantities(todayRecord.upQuantities) : 0;
    const todayDown = todayRecord ? sumQuantities(todayRecord.downQuantities) : 0;
    const pending = Math.max(0, (detail?.quantity ?? 0) - downTotal);
    return {
      todayUp,
      todayDown,
      todayDiff: Math.abs(todayUp - todayDown),
      pending,
    };
  }, [detail?.quantity, records, today]);

  if (!detail || !data) return <View style={styles.root} />;

  return (
    <ReceivingRecordsScrollShell
      headerHeight={headerHeight}
      scrollRef={scrollRef}
      onScroll={onScroll}
      contentBottomInset={contentBottomInset}
      rootKeyboardInset={rootKeyboardInset}
      footer={<ReceivingBottomActionBar rightLabel="提交" onRightPress={handleSubmit} />}
    >
      <ReceivingOrderInfoCard detail={detail} />

      {records.map((record) => {
        const expanded = expandedIds.includes(record.id);
        const isEditing = !record.submitted || editingId === record.id;
        const showEditBtn = expanded && record.submitted && editingId !== record.id;
        const showDaySummary = isEditing && record.date === today;

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setEditingId(record.id);
                ensureExpanded(record.id);
              }}
              style={styles.editBtn}
            >
              <EditIcon color="#6C829E" height={16} width={16} />
              <Text style={styles.editText}>编辑</Text>
            </Pressable>
          );
        }

        return (
          <ExpandableRecordCard
            key={record.id}
            title={`车位日期: ${formatDateTitle(record.date)}`}
            expanded={expanded}
            onToggleExpand={() => toggleExpand(record.id)}
            {...(headerRight ? { headerRight } : {})}
          >
            {isEditing ? (
              <>
                <Text style={styles.sectionTitle}>上车位数量：</Text>
                <ReceivingQuantityGrid
                  editable
                  onChange={(upQuantities) => updateRecord(record.id, { upQuantities })}
                  onInputFocus={onInputFocus}
                  sizes={sizes}
                  values={record.upQuantities}
                />
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>下车位数量：</Text>
                <ReceivingQuantityGrid
                  editable
                  onChange={(downQuantities) => updateRecord(record.id, { downQuantities })}
                  onInputFocus={onInputFocus}
                  sizes={sizes}
                  values={record.downQuantities}
                />
                {showDaySummary ? (
                  <View style={styles.daySummary}>
                    <View style={styles.daySummaryRow}>
                      <Text style={styles.daySummaryLabel}>当天上车位</Text>
                      <Text style={styles.daySummaryValue}>{totals.todayUp}件</Text>
                    </View>
                    <View style={styles.daySummaryRow}>
                      <Text style={styles.daySummaryLabel}>当天下车位</Text>
                      <Text style={styles.daySummaryValue}>{totals.todayDown}件</Text>
                    </View>
                    <View style={styles.daySummaryRow}>
                      <Text style={styles.daySummaryLabel}>当日上下车位差异</Text>
                      <Text style={styles.daySummaryValue}>{totals.todayDiff}件</Text>
                    </View>
                    <View style={styles.daySummaryRow}>
                      <Text style={styles.daySummaryLabel}>全部待车</Text>
                      <Text style={styles.daySummaryValue}>{totals.pending}件</Text>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>上车位数量</Text>
                <RecordDetailPanel items={toDetailItems(sizes, record.upQuantities)} />
                <Text style={styles.sectionTitle}>下车位数量</Text>
                <RecordDetailPanel items={toDetailItems(sizes, record.downQuantities)} />
              </>
            )}
          </ExpandableRecordCard>
        );
      })}
    </ReceivingRecordsScrollShell>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  editText: {
    color: '#6C829E',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
  sectionDivider: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#CBD5E5',
  },
  daySummary: {
    gap: 16,
    backgroundColor: '#F7F9FA',
    borderRadius: 8,
    padding: 16,
  },
  daySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryLabel: {
    fontSize: 16,
    color: '#021626',
    fontWeight: 600,
  },
  daySummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#105FC8',
  },
});
