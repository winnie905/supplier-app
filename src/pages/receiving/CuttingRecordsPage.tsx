import { useHeaderHeight } from '@react-navigation/elements';
import { VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

import AddIcon from '@/assets/icons/circlePlusOutline.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import EditIcon from '@/assets/icons/edit.svg';
import MarkEmailReadIcon from '@/assets/icons/markEmailRead.svg';
import { DashedButton } from '@/components/DashedButton';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { useToast } from '@/components/toast/Toast';
import { CUTTING_EXCEPTION_TYPES } from '@/constants/receiving';
import { ROUTES } from '@/constants/routes';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import {
  useCuttingRecords,
  useFactoryExceptions,
  useProductionColorDetail,
} from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingExceptionSheet } from '@/sections/receiving/ReceivingExceptionSheet';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import {
  emptySizeQuantities,
  receivingService,
  sumQuantities,
} from '@/services/receiving/receivingService';
import type { CuttingBedRecord } from '@/types/receiving';

type CuttingRecordsPageProps = LogisticsScreenProps<'CuttingRecords'>;

type ScrollViewWithKeyboard = ScrollView & {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset: number,
    preventNegativeScrollOffset: boolean,
  ) => void;
};

const sortBedsNewestFirst = (beds: CuttingBedRecord[]) =>
  [...beds].sort((a, b) => b.bedNo - a.bedNo);

export const CuttingRecordsPage = ({ navigation, route }: CuttingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast } = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useCuttingRecords(productionColorId);
  const { items: exceptions, pendingCount } = useFactoryExceptions(productionColorId, 'cutting');

  const scrollRef = useRef<ScrollViewWithKeyboard>(null);
  const didInitExpandRef = useRef(false);
  const creatingFirstBedRef = useRef(false);

  const [beds, setBeds] = useState<CuttingBedRecord[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [exceptionVisible, setExceptionVisible] = useState(false);
  const [exceptionType, setExceptionType] = useState<string>(CUTTING_EXCEPTION_TYPES[0]);
  const [exceptionDesc, setExceptionDesc] = useState('');

  const sizes = useMemo(() => data?.sizes ?? detail?.sizes ?? [], [data?.sizes, detail?.sizes]);

  const persistBeds = useCallback(
    async (next: CuttingBedRecord[], editing?: string) => {
      setBeds(next);
      setEditingId(editing);
      await receivingService.saveCuttingDraft(productionColorId, next, editing);
    },
    [productionColorId],
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
        await persistBeds(nextBeds, bed.id);
        creatingFirstBedRef.current = false;
      }

      setBeds(nextBeds);

      // 进入页面：仅展开最前（最新）床次，其余收起
      if (!didInitExpandRef.current && nextBeds.length > 0) {
        didInitExpandRef.current = true;
        setExpandedIds([nextBeds[0]!.id]);
      }

      if (data.editingBedId) setEditingId(data.editingBedId);
    };

    void syncBeds();
  }, [data, persistBeds, sizes]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate(ROUTES.LOGISTICS.EXCEPTION_REPLY_LIST, {
              productionColorId,
              module: 'cutting',
            })
          }
          style={styles.headerRight}
        >
          <MarkEmailReadIcon color="#105FC8" height={16} width={16} />
          <Text style={styles.headerRightText}>异常回复</Text>
          {pendingCount > 0 ? <View style={styles.badgeDot} /> : null}
        </Pressable>
      ),
    });
  }, [navigation, pendingCount, productionColorId]);

  const cornerTag = useMemo(() => {
    const pending = exceptions.filter((item) => item.status === 'pending');
    if (pending.length === 0 && !detail?.moduleStatus.cutting.hasException) return undefined;
    const labels = pending.map((item) => item.type).filter(Boolean);
    if (labels.length > 0) return labels.join('、');
    return '辅料库存不足、裁数不足';
  }, [detail?.moduleStatus.cutting.hasException, exceptions]);

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
    await persistBeds(next, bed.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    await persistBeds(next, editingId === id ? undefined : editingId);
    setExpandedIds((prev) => {
      const remaining = prev.filter((x) => x !== id);
      if (remaining.length > 0) return remaining;
      return next[0] ? [next[0].id] : [];
    });
  };

  const handleSubmit = () => {
    void runSubmit(async () => {
      const targets = beds.filter((bed) => !bed.submitted || bed.id === editingId);
      if (targets.length === 0) {
        showToast('没有可提交的床次', { duration: 3000 });
        return;
      }
      try {
        for (const bed of targets) {
          await receivingService.submitCuttingBed(productionColorId, bed.id);
        }
        setEditingId(undefined);
        // 提交后仍保持最前床次展开
        setExpandedIds(beds[0] ? [beds[0].id] : []);
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
      await receivingService.submitCuttingException({
        productionColorId,
        type: exceptionType,
        description: exceptionDesc,
      });
      setExceptionVisible(false);
      setExceptionDesc('');
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
                    setExpandedIds((prev) => (prev.includes(bed.id) ? prev : [...prev, bed.id]));
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
                        onInputFocus={handleInputFocus}
                        showStepLarge={false}
                        value={bed.bundleCount}
                      />
                    </VStack>
                    <ReceivingQuantityGrid
                      editable
                      onChange={(sizeQuantities) => updateBed(bed.id, { sizeQuantities })}
                      onInputFocus={handleInputFocus}
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
              <Text style={styles.summaryValue}>{data.plannedTotal}件</Text>
            </View>
            <View style={styles.cutSubtotalBox}>
              <Text style={styles.cutSubtotalText}>裁剪小计</Text>
              <Text style={styles.cutSubtotalText}>
                {sizes.map((size) => `${size}: ${totals.bySize[size] ?? 0}`).join('、')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ReceivingBottomActionBar
        left={
          <Pressable
            accessibilityRole="button"
            onPress={() => setExceptionVisible(true)}
            style={styles.exceptionBtn}
          >
            <Text style={styles.exceptionBtnText}>异常上报</Text>
          </Pressable>
        }
        rightLabel="提交"
        onRightPress={handleSubmit}
      />

      <ReceivingExceptionSheet
        visible={exceptionVisible}
        tags={['裁床异常']}
        types={CUTTING_EXCEPTION_TYPES}
        selectedType={exceptionType}
        description={exceptionDesc}
        onClose={() => setExceptionVisible(false)}
        onDescriptionChange={setExceptionDesc}
        onTypeChange={setExceptionType}
        onSubmit={handleExceptionSubmit}
      />
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
  dashedBtn: {
    marginHorizontal: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 16,
    position: 'relative',
  },
  headerRightText: {
    color: '#105FC8',
    fontSize: 15,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
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
    height: 45,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#105FC8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exceptionBtnText: {
    color: '#105FC8',
    fontSize: 18,
  },
});
