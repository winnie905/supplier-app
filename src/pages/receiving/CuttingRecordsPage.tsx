import { useHeaderHeight } from '@react-navigation/elements';
import { designTokens, useToast, VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AddIcon from '@/assets/icons/circlePlusOutline.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import { DashedButton } from '@/components/DashedButton';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RecordDetailPanel, toSizeDetailItems } from '@/components/RecordDetailPanel';
import { CUTTING_EXCEPTION_TYPES } from '@/constants/receiving';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import {
  ExceptionReportButton,
  useExceptionReportChrome,
} from '@/hooks/receiving/useExceptionReportChrome';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { useCuttingRecords, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import { useRecordsSubmit } from '@/hooks/receiving/useRecordsSubmit';
import { useSyncedExpandableRecords } from '@/hooks/receiving/useSyncedExpandableRecords';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingExceptionSheet } from '@/sections/receiving/ReceivingExceptionSheet';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import { ReceivingSummaryCard } from '@/sections/receiving/ReceivingSummaryCard';
import { RecordCardEditButton } from '@/sections/receiving/RecordCardEditButton';
import {
  emptySizeQuantities,
  receivingService,
  sizeNamesFromRange,
  sumQuantities,
} from '@/services/receiving/receivingService';
import type { CuttingBedRecord } from '@/types/receiving';
import { submitExceptionReport } from '@/utils/receiving/submitExceptionReport';

type CuttingRecordsPageProps = LogisticsScreenProps<'CuttingRecords'>;

const sortBedsNewestFirst = (beds: CuttingBedRecord[]) =>
  [...beds].sort((a, b) => b.bedNo - a.bedNo);

export const CuttingRecordsPage = ({ navigation, route }: CuttingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const toast = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useCuttingRecords(productionColorId);
  const {
    cornerTag,
    exceptionVisible,
    exceptionTypes,
    setExceptionTypes,
    exceptionDesc,
    setExceptionDesc,
    openExceptionSheet,
    closeExceptionSheet,
    resetExceptionForm,
    refreshExceptions,
  } = useExceptionReportChrome({
    navigation,
    productionColorId,
    module: 'cutting',
    allowedTypes: CUTTING_EXCEPTION_TYPES,
    selectFirstTypeOnOpen: true,
  });
  const { scrollRef, onInputFocus, onScroll, contentBottomInset, rootKeyboardInset } =
    useKeyboardAwareScroll();

  const sizes = useMemo(
    () => data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []),
    [data?.sizes, detail],
  );

  const getApiRecords = useCallback((payload: NonNullable<typeof data>) => payload.beds, []);
  const ensureSeed = useCallback(
    (records: CuttingBedRecord[], seedOnce: () => boolean) => {
      // 首次进入且无床次：自动创建第 1 床并展开尺码（仅内存）
      if (records.length > 0 || sizes.length === 0 || !seedOnce()) return null;
      return [
        {
          id: `local-${Date.now()}`,
          bedNo: 1,
          bundleCount: 0,
          sizeQuantities: emptySizeQuantities(sizes),
          submitted: false,
        },
      ];
    },
    [sizes],
  );

  const {
    records: beds,
    persistRecords: persistBeds,
    expandedIds,
    setExpandedIds,
    editingId,
    setEditingId,
    toggleExpand,
    ensureExpanded,
    collapseToFirst,
  } = useSyncedExpandableRecords({
    data,
    getApiRecords,
    sortRecords: sortBedsNewestFirst,
    ensureSeed,
    persistEditingId: true,
  });

  const addBed = () => {
    const nextNo = beds.reduce((max, bed) => Math.max(max, bed.bedNo), 0) + 1;
    const bed: CuttingBedRecord = {
      id: `local-${Date.now()}`,
      bedNo: nextNo,
      bundleCount: 0,
      sizeQuantities: emptySizeQuantities(sizes),
      submitted: false,
    };
    // 新床次置顶；先写入展开态，避免先收起再展开的闪烁
    const next = [bed, ...beds];
    setExpandedIds((prev) => (prev.includes(bed.id) ? prev : [bed.id, ...prev]));
    persistBeds(next, bed.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const updateBed = (id: string, patch: Partial<CuttingBedRecord>) => {
    const next = beds.map((bed) => (bed.id === id ? { ...bed, ...patch } : bed));
    persistBeds(next, editingId);
  };

  const deleteBed = (id: string) => {
    if (beds.length <= 1) return;
    const filtered = beds.filter((bed) => bed.id !== id);
    // 保持最新在前，并按顺序重编号
    const ascending = [...filtered].sort((a, b) => a.bedNo - b.bedNo);
    const renumbered = ascending.map((bed, index) => ({ ...bed, bedNo: index + 1 }));
    const next = sortBedsNewestFirst(renumbered);
    persistBeds(next, editingId === id ? undefined : editingId);
    setExpandedIds((prev) => {
      const remaining = prev.filter((x) => x !== id);
      if (remaining.length > 0) return remaining;
      return next[0] ? [next[0].id] : [];
    });
  };

  // 提交后仍保持最前床次展开
  const handleSubmit = useRecordsSubmit({
    records: beds,
    editingId,
    setEditingId,
    collapseToFirst,
    refresh,
    runSubmit,
    submit: (targetIds) =>
      receivingService.submitCuttingRecords(productionColorId, beds, targetIds),
  });

  const handleExceptionSubmit = () => {
    void runSubmit(() =>
      submitExceptionReport({
        exceptionTypes,
        toast,
        submit: async () => {
          await receivingService.submitCuttingException({
            productionColorId,
            type: exceptionTypes.join('、'),
            description: exceptionDesc,
          });
        },
        closeExceptionSheet,
        resetExceptionForm,
        afterSuccess: () => refreshExceptions(),
      }),
    );
  };

  const totals = useMemo(() => {
    const submitted = beds.filter((b) => b.submitted);
    const source = submitted.length > 0 ? submitted : beds;
    const total = source.reduce((sum, bed) => sum + sumQuantities(bed.sizeQuantities), 0);
    const bySize: Record<string, number> = {};
    sizes.forEach((size) => {
      bySize[size] = source.reduce(
        (sum, bed) => sum + (bed.sizeQuantities.find((q) => q.size === size)?.quantity ?? 0),
        0,
      );
    });
    return { total, bySize };
  }, [beds, sizes]);

  if (!detail || !data) return <View style={styles.root} />;

  return (
    <ReceivingRecordsScrollShell
      headerHeight={headerHeight}
      scrollRef={scrollRef}
      onScroll={onScroll}
      contentBottomInset={contentBottomInset}
      rootKeyboardInset={rootKeyboardInset}
      footer={
        <>
          <ReceivingBottomActionBar
            left={
              <ExceptionReportButton onPress={openExceptionSheet} style={styles.exceptionBtn} />
            }
            rightLabel="提交"
            onRightPress={handleSubmit}
          />
          <ReceivingExceptionSheet
            visible={exceptionVisible}
            tags={[]}
            types={CUTTING_EXCEPTION_TYPES}
            selectedTypes={exceptionTypes}
            selectionMode="single"
            description={exceptionDesc}
            onClose={closeExceptionSheet}
            onDescriptionChange={setExceptionDesc}
            onTypesChange={setExceptionTypes}
            onSubmit={handleExceptionSubmit}
          />
        </>
      }
    >
      <ReceivingOrderInfoCard cornerTag={cornerTag} detail={detail} />

      <DashedButton
        icon={<AddIcon color={designTokens.colors.brand[500]} height={16} width={16} />}
        label="添加床次"
        onPress={() => void addBed()}
        style={styles.dashedBtn}
      />

      {beds.map((bed) => {
        const expanded = expandedIds.includes(bed.id);
        const subtotal = sumQuantities(bed.sizeQuantities);
        const isEditing = !bed.submitted || editingId === bed.id;
        const showEditBtn = expanded && bed.submitted && editingId !== bed.id;
        const items = toSizeDetailItems(sizes, bed.sizeQuantities);

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <RecordCardEditButton
              onPress={() => {
                setEditingId(bed.id);
                ensureExpanded(bed.id);
              }}
            />
          );
        } else if (!bed.submitted && beds.length > 1) {
          headerRight = (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void deleteBed(bed.id)}
              style={styles.deleteBtn}
            >
              <DeleteIcon height={16} width={16} />
            </Pressable>
          );
        }

        return (
          <ExpandableRecordCard
            key={bed.id}
            title={`第 ${bed.bedNo} 床次`}
            subtitle={<Text style={styles.bedSubtotal}>小计：{subtotal}件</Text>}
            expanded={expanded}
            onToggleExpand={() => toggleExpand(bed.id)}
            {...(headerRight ? { headerRight } : {})}
          >
            {isEditing ? (
              <>
                <VStack gap={4}>
                  <Text style={styles.fieldLabel}>扎数</Text>
                  <QuantityStepper
                    editable
                    onChange={(bundleCount) => updateBed(bed.id, { bundleCount })}
                    onInputFocus={onInputFocus}
                    showStepLarge={false}
                    value={bed.bundleCount}
                  />
                </VStack>
                <ReceivingQuantityGrid
                  editable
                  onChange={(sizeQuantities) => updateBed(bed.id, { sizeQuantities })}
                  onInputFocus={onInputFocus}
                  sizes={sizes}
                  values={bed.sizeQuantities}
                />
              </>
            ) : (
              <RecordDetailPanel
                primaryLabel="扎数"
                primaryValue={bed.bundleCount}
                items={items.map(({ key, label, value }) => ({ key, label, value }))}
              />
            )}
          </ExpandableRecordCard>
        );
      })}

      <ReceivingSummaryCard
        rows={[
          { label: '总计:', value: `${totals.total}件` },
          { label: '生产计划总计:', value: `${data.quantity}件` },
        ]}
      >
        <View style={styles.cutSubtotalBox}>
          <Text style={styles.cutSubtotalText}>裁剪小计</Text>
          <Text style={styles.cutSubtotalText}>
            {sizes.map((size) => `${size}: ${totals.bySize[size] ?? 0}`).join('、')}
          </Text>
        </View>
      </ReceivingSummaryCard>
    </ReceivingRecordsScrollShell>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dashedBtn: {
    marginHorizontal: 10,
  },
  bedSubtotal: {
    fontSize: 14,
    color: '#6B7A90',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cutSubtotalBox: {
    backgroundColor: designTokens.colors.gray[50],
    borderRadius: 8,
    padding: 10,
  },
  cutSubtotalText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#4B5D73',
  },
  exceptionBtn: {
    minWidth: 110,
    paddingHorizontal: 14,
  },
});
