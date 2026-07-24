import { useHeaderHeight } from '@react-navigation/elements';
import { VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AddIcon from '@/assets/icons/circlePlusOutline.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import EditIcon from '@/assets/icons/edit.svg';
import { DashedButton } from '@/components/DashedButton';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { useToast } from '@/components/toast/Toast';
import { CUTTING_EXCEPTION_TYPES } from '@/constants/receiving';
import { useDebouncedPersist } from '@/hooks/receiving/useDebouncedPersist';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import {
  ExceptionReportButton,
  useExceptionReportChrome,
} from '@/hooks/receiving/useExceptionReportChrome';
import { useExpandableRecordList } from '@/hooks/receiving/useExpandableRecordList';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { useCuttingRecords, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingExceptionSheet } from '@/sections/receiving/ReceivingExceptionSheet';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import {
  emptySizeQuantities,
  receivingService,
  sumQuantities,
} from '@/services/receiving/receivingService';
import type { CuttingBedRecord } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';

type CuttingRecordsPageProps = LogisticsScreenProps<'CuttingRecords'>;

const sortBedsNewestFirst = (beds: CuttingBedRecord[]) =>
  [...beds].sort((a, b) => b.bedNo - a.bedNo);

export const CuttingRecordsPage = ({ navigation, route }: CuttingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast } = useToast();
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
  });
  const { scrollRef, onInputFocus, onScroll, contentBottomInset, rootKeyboardInset } =
    useKeyboardAwareScroll();
  const {
    expandedIds,
    setExpandedIds,
    editingId,
    setEditingId,
    toggleExpand,
    ensureExpanded,
    initExpandFirst,
    collapseToFirst,
  } = useExpandableRecordList();

  const creatingFirstBedRef = useRef(false);

  const [beds, setBeds] = useState<CuttingBedRecord[]>([]);

  const sizes = useMemo(
    () => data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []),
    [data?.sizes, detail],
  );

  const { schedule: schedulePersist, flush: flushPersist } = useDebouncedPersist(
    async (next: CuttingBedRecord[], editing?: string) => {
      await receivingService.saveCuttingDraft(productionColorId, next, editing);
    },
  );

  const persistBeds = useCallback(
    async (next: CuttingBedRecord[], editing?: string, immediate = false) => {
      setBeds(next);
      setEditingId(editing);
      if (immediate) {
        await receivingService.saveCuttingDraft(productionColorId, next, editing);
        return;
      }
      schedulePersist(next, editing);
    },
    [productionColorId, schedulePersist, setEditingId],
  );

  useEffect(() => {
    if (!data) return;

    const syncBeds = async () => {
      let nextBeds = sortBedsNewestFirst(data.beds);

      // 首次进入且无床次：自动创建第 1 床并展开尺码
      if (nextBeds.length === 0 && sizes.length > 0 && !creatingFirstBedRef.current) {
        creatingFirstBedRef.current = true;
        const bed: CuttingBedRecord = {
          id: `bed-${Date.now()}`,
          bedNo: 1,
          bundleCount: 0,
          sizeQuantities: emptySizeQuantities(sizes),
          submitted: false,
        };
        nextBeds = [bed];
        await persistBeds(nextBeds, bed.id, true);
        creatingFirstBedRef.current = false;
      }

      setBeds(nextBeds);

      // 进入页面：仅展开最前（最新）床次，其余收起
      if (nextBeds.length > 0) {
        initExpandFirst(nextBeds[0]!.id);
      }

      if (data.editingBedId) setEditingId(data.editingBedId);
    };

    void syncBeds();
  }, [data, initExpandFirst, persistBeds, setEditingId, sizes]);

  const addBed = async () => {
    const nextNo = beds.reduce((max, bed) => Math.max(max, bed.bedNo), 0) + 1;
    const bed: CuttingBedRecord = {
      id: `bed-${Date.now()}`,
      bedNo: nextNo,
      bundleCount: 0,
      sizeQuantities: emptySizeQuantities(sizes),
      submitted: false,
    };
    // 新床次置顶；先写入展开态，避免先收起再展开的闪烁
    const next = [bed, ...beds];
    setExpandedIds((prev) => (prev.includes(bed.id) ? prev : [bed.id, ...prev]));
    await persistBeds(next, bed.id, true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const updateBed = (id: string, patch: Partial<CuttingBedRecord>) => {
    const next = beds.map((bed) => (bed.id === id ? { ...bed, ...patch } : bed));
    void persistBeds(next, editingId);
  };

  const deleteBed = async (id: string) => {
    if (beds.length <= 1) return;
    const filtered = beds.filter((bed) => bed.id !== id);
    // 保持最新在前，并按顺序重编号
    const ascending = [...filtered].sort((a, b) => a.bedNo - b.bedNo);
    const renumbered = ascending.map((bed, index) => ({ ...bed, bedNo: index + 1 }));
    const next = sortBedsNewestFirst(renumbered);
    await persistBeds(next, editingId === id ? undefined : editingId, true);
    setExpandedIds((prev) => {
      const remaining = prev.filter((x) => x !== id);
      if (remaining.length > 0) return remaining;
      return next[0] ? [next[0].id] : [];
    });
  };

  const handleSubmit = () => {
    void runSubmit(async () => {
      await flushPersist();
      const targets = beds.filter((bed) => !bed.submitted || bed.id === editingId);
      if (targets.length === 0) {
        showToast('没有可提交的床次', { duration: 3000 });
        return;
      }
      try {
        const targetIds = targets.map((bed) => bed.id);
        await receivingService.submitCuttingRecords(productionColorId, beds, targetIds);
        setEditingId(undefined);
        // 提交后仍保持最前床次展开
        collapseToFirst(beds[0]?.id);
        await refresh();
        showToast('提交成功', { duration: 3000 });
      } catch (error) {
        if (error instanceof Error && error.message === 'EMPTY_FORM') {
          showToast('不能提交空白表单！', { duration: 3000 });
        }
      }
    });
  };

  const handleExceptionSubmit = () => {
    void runSubmit(async () => {
      if (exceptionTypes.length === 0) {
        showToast('请选择异常类型', { duration: 3000 });
        return;
      }
      await receivingService.submitCuttingException({
        productionColorId,
        type: exceptionTypes.join('、'),
        description: exceptionDesc,
      });
      closeExceptionSheet();
      resetExceptionForm();
      await refreshExceptions();
      showToast('异常已提交', { duration: 3000 });
    });
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
            tags={['裁床异常']}
            types={CUTTING_EXCEPTION_TYPES}
            selectedTypes={exceptionTypes}
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
        icon={<AddIcon color="#105FC8" height={16} width={16} />}
        label="添加床次"
        onPress={() => void addBed()}
        style={styles.dashedBtn}
      />

      {beds.map((bed) => {
        const expanded = expandedIds.includes(bed.id);
        const subtotal = sumQuantities(bed.sizeQuantities);
        const isEditing = !bed.submitted || editingId === bed.id;
        const showEditBtn = expanded && bed.submitted && editingId !== bed.id;
        const items = sizes.map((size) => ({
          key: size,
          label: size,
          value: bed.sizeQuantities.find((item) => item.size === size)?.quantity ?? 0,
        }));

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setEditingId(bed.id);
                ensureExpanded(bed.id);
              }}
              style={styles.editBtn}
            >
              <EditIcon color="#6C829E" height={16} width={16} />
              <Text style={styles.editText}>编辑</Text>
            </Pressable>
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

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>总计:</Text>
          <Text style={styles.summaryValue}>{totals.total}件</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>生产计划总计:</Text>
          <Text style={styles.summaryValue}>{data.quantity}件</Text>
        </View>
        <View style={styles.cutSubtotalBox}>
          <Text style={styles.cutSubtotalText}>裁剪小计</Text>
          <Text style={styles.cutSubtotalText}>
            {sizes.map((size) => `${size}: ${totals.bySize[size] ?? 0}`).join('、')}
          </Text>
        </View>
      </View>
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
  summary: {
    marginHorizontal: 10,
    marginBottom: 8,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#021626',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#105FC8',
    fontWeight: '700',
  },
  cutSubtotalBox: {
    backgroundColor: '#F7F9FC',
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
