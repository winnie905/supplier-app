import { useHeaderHeight } from '@react-navigation/elements';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { RecordDetailPanel, toSizeDetailItems } from '@/components/RecordDetailPanel';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { useProductionColorDetail, useSewingRecords } from '@/hooks/receiving/useReceiving';
import { useRecordsSubmit } from '@/hooks/receiving/useRecordsSubmit';
import { useSyncedExpandableRecords } from '@/hooks/receiving/useSyncedExpandableRecords';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import { RecordCardEditButton } from '@/sections/receiving/RecordCardEditButton';
import { SewingDaySummary } from '@/sections/receiving/sewing/SewingDaySummary';
import {
  emptySizeQuantities,
  receivingService,
  sizeNamesFromRange,
  sumQuantities,
  todayString,
} from '@/services/receiving/receivingService';
import type { SewingDayRecord } from '@/types/receiving';
import { formatDateSlash } from '@/utils/date';

type SewingRecordsPageProps = LogisticsScreenProps<'SewingRecords'>;

export const SewingRecordsPage = ({ route }: SewingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useSewingRecords(productionColorId);
  const { scrollRef, onInputFocus, onScroll, contentBottomInset, rootKeyboardInset } =
    useKeyboardAwareScroll();

  const sizes = useMemo(
    () => data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []),
    [data?.sizes, detail],
  );
  const today = data?.today ?? todayString();

  const getApiRecords = useCallback((payload: NonNullable<typeof data>) => payload.records, []);
  const sortRecords = useCallback(
    (list: SewingDayRecord[]) => [...list].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  const ensureSeed = useCallback(
    (list: SewingDayRecord[], seedOnce: () => boolean) => {
      // 无当日记录时，自动补一条今日草稿（仅内存）
      if (sizes.length === 0 || list.some((record) => record.date === today) || !seedOnce()) {
        return null;
      }
      return [
        {
          id: `local-${today}`,
          date: today,
          upQuantities: emptySizeQuantities(sizes),
          downQuantities: emptySizeQuantities(sizes),
          submitted: false,
        },
        ...list,
      ];
    },
    [sizes, today],
  );
  const alsoEditFirst = useCallback((first: SewingDayRecord) => !first.submitted, []);

  const {
    records,
    persistRecords,
    resetSyncGuards,
    expandedIds,
    editingId,
    setEditingId,
    toggleExpand,
    ensureExpanded,
    collapseToFirst,
  } = useSyncedExpandableRecords({
    data,
    getApiRecords,
    sortRecords,
    ensureSeed,
    alsoEditFirst,
  });

  const updateRecord = (id: string, patch: Partial<SewingDayRecord>) => {
    persistRecords(records.map((record) => (record.id === id ? { ...record, ...patch } : record)));
  };

  const handleSubmit = useRecordsSubmit({
    records,
    editingId,
    setEditingId,
    collapseToFirst,
    resetSyncGuards,
    refresh,
    runSubmit,
    submit: (targetIds) =>
      receivingService.submitSewingRecords(productionColorId, records, targetIds),
  });

  /** 全部待车：计划数减去已提交的下车位总数，各条记录共用 */
  const pendingTotal = useMemo(() => {
    const downTotal = records
      .filter((record) => record.submitted)
      .reduce((sum, record) => sum + sumQuantities(record.downQuantities), 0);
    return Math.max(0, (detail?.quantity ?? 0) - downTotal);
  }, [detail?.quantity, records]);

  /** 是否存在待提交/编辑中的记录，决定是否展示提交按钮 */
  const hasEditingRecord = records.some((record) => !record.submitted || record.id === editingId);

  if (!detail || !data) return <View style={styles.root} />;

  return (
    <ReceivingRecordsScrollShell
      headerHeight={headerHeight}
      scrollRef={scrollRef}
      onScroll={onScroll}
      contentBottomInset={contentBottomInset}
      rootKeyboardInset={rootKeyboardInset}
      {...(hasEditingRecord
        ? { footer: <ReceivingBottomActionBar rightLabel="提交" onRightPress={handleSubmit} /> }
        : {})}
    >
      <ReceivingOrderInfoCard detail={detail} />

      {records.map((record) => {
        const expanded = expandedIds.includes(record.id);
        const isEditing = !record.submitted || editingId === record.id;
        const showEditBtn = expanded && record.submitted && editingId !== record.id;
        const dayUp = sumQuantities(record.upQuantities);
        const dayDown = sumQuantities(record.downQuantities);

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <RecordCardEditButton
              onPress={() => {
                setEditingId(record.id);
                ensureExpanded(record.id);
              }}
            />
          );
        }

        return (
          <ExpandableRecordCard
            key={record.id}
            title={`车位日期: ${formatDateSlash(record.date)}`}
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
                <SewingDaySummary up={dayUp} down={dayDown} pending={pendingTotal} />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>上车位数量</Text>
                <RecordDetailPanel items={toSizeDetailItems(sizes, record.upQuantities)} />
                <Text style={styles.sectionTitle}>下车位数量</Text>
                <RecordDetailPanel items={toSizeDetailItems(sizes, record.downQuantities)} />
                <SewingDaySummary up={dayUp} down={dayDown} pending={pendingTotal} />
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#061B37',
  },
  sectionDivider: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#CBD5E5',
  },
});
