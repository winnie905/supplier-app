import { useHeaderHeight } from '@react-navigation/elements';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  type FocusEvent,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EditIcon from '@/assets/icons/edit.svg';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { useToast } from '@/components/toast/Toast';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import { useProductionColorDetail, useSewingRecords } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import {
  receivingService,
  sumQuantities,
  todayString,
} from '@/services/receiving/receivingService';
import type { SewingDayRecord, SizeQuantity } from '@/types/receiving';

type SewingRecordsPageProps = LogisticsScreenProps<'SewingRecords'>;

type ScrollViewWithKeyboard = ScrollView & {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset: number,
    preventNegativeScrollOffset: boolean,
  ) => void;
};

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

  const scrollRef = useRef<ScrollViewWithKeyboard>(null);
  const didInitExpandRef = useRef(false);

  const [records, setRecords] = useState<SewingDayRecord[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();

  const sizes = data?.sizes ?? detail?.sizes ?? [];
  const today = data?.today ?? todayString();

  useEffect(() => {
    if (!data?.records) return;
    const sorted = [...data.records].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(sorted);

    if (!didInitExpandRef.current && sorted.length > 0) {
      didInitExpandRef.current = true;
      const first = sorted[0]!;
      setExpandedIds([first.id]);
      if (!first.submitted) setEditingId(first.id);
    }
  }, [data]);

  const persist = async (next: SewingDayRecord[]) => {
    setRecords(next);
    await receivingService.saveSewingRecords(productionColorId, next);
  };

  const updateRecord = (id: string, patch: Partial<SewingDayRecord>) => {
    const next = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
    void persist(next);
  };

  const handleInputFocus = useCallback((event: FocusEvent) => {
    const target = event.target as unknown;
    const nodeHandle =
      typeof target === 'number'
        ? target
        : findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
    if (!nodeHandle) return;
    setTimeout(() => {
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(nodeHandle, 140, true);
    }, 150);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    void runSubmit(async () => {
      const targets = records.filter((record) => !record.submitted || record.id === editingId);
      if (targets.length === 0) {
        showToast('没有可提交的记录', { duration: 3000 });
        return;
      }
      try {
        for (const record of targets) {
          await receivingService.submitSewingRecord(productionColorId, record.id);
        }
        setEditingId(undefined);
        setExpandedIds(records[0] ? [records[0].id] : []);
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
    const pending = Math.max(0, (detail?.plannedTotal ?? 0) - downTotal);
    return {
      todayUp,
      todayDown,
      todayDiff: Math.abs(todayUp - todayDown),
      pending,
    };
  }, [detail?.plannedTotal, records, today]);

  if (!detail || !data) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={[styles.scrollView, { marginTop: headerHeight }]}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
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
                    setExpandedIds((prev) =>
                      prev.includes(record.id) ? prev : [...prev, record.id],
                    );
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
                      onInputFocus={handleInputFocus}
                      sizes={sizes}
                      values={record.upQuantities}
                    />
                    <View style={styles.sectionDivider} />
                    <Text style={styles.sectionTitle}>下车位数量：</Text>
                    <ReceivingQuantityGrid
                      editable
                      onChange={(downQuantities) => updateRecord(record.id, { downQuantities })}
                      onInputFocus={handleInputFocus}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <ReceivingBottomActionBar rightLabel="提交" onRightPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
    gap: 10,
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
