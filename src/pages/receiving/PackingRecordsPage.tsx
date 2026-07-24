import { useHeaderHeight } from '@react-navigation/elements';
import { VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AddIcon from '@/assets/icons/circlePlusOutline.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import EditIcon from '@/assets/icons/edit.svg';
import { DashedButton } from '@/components/DashedButton';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { useToast } from '@/components/toast/Toast';
import { useDebouncedPersist } from '@/hooks/receiving/useDebouncedPersist';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import { useExpandableRecordList } from '@/hooks/receiving/useExpandableRecordList';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { usePackingRecords, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { PackingCartonSheet } from '@/sections/receiving/packing/PackingCartonSheet';
import { PackingSummaryCard } from '@/sections/receiving/packing/PackingSummaryCard';
import { formatCartonDim, sortBoxesNewestFirst } from '@/sections/receiving/packing/utils';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingImagePreview } from '@/sections/receiving/ReceivingImagePreview';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import {
  emptySizeQuantities,
  receivingService,
  sumQuantities,
} from '@/services/receiving/receivingService';
import type { CartonSpec, PackingBoxRecord } from '@/types/receiving';
import { sizeNamesFromRange } from '@/types/receiving';

type PackingRecordsPageProps = LogisticsScreenProps<'PackingRecords'>;

export const PackingRecordsPage = ({ navigation, route }: PackingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { showToast } = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = usePackingRecords(productionColorId);
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

  const [boxes, setBoxes] = useState<PackingBoxRecord[]>([]);
  const [cartonSheetVisible, setCartonSheetVisible] = useState(false);
  const [cartonTargetBoxId, setCartonTargetBoxId] = useState<string | null>(null);
  const [pendingCartonId, setPendingCartonId] = useState<string | undefined>();
  const [packagePreviewVisible, setPackagePreviewVisible] = useState(false);

  const sizes = data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []);
  const [cartonSpecs, setCartonSpecs] = useState<CartonSpec[]>(() =>
    receivingService.getCartonSpecs(),
  );

  useEffect(() => {
    let cancelled = false;
    void receivingService.getCartonSpecsForProductionColor(productionColorId).then((list) => {
      if (!cancelled && list.length > 0) setCartonSpecs(list);
    });
    return () => {
      cancelled = true;
    };
  }, [productionColorId]);

  const { schedule: schedulePersist, flush: flushPersist } = useDebouncedPersist(
    async (next: PackingBoxRecord[], editing?: string) => {
      await receivingService.savePackingDraft(productionColorId, next, editing);
    },
  );

  const persist = useCallback(
    async (next: PackingBoxRecord[], editing?: string, immediate = false) => {
      setBoxes(next);
      setEditingId(editing);
      if (immediate) {
        await receivingService.savePackingDraft(productionColorId, next, editing);
        return;
      }
      schedulePersist(next, editing);
    },
    [productionColorId, schedulePersist, setEditingId],
  );

  useEffect(() => {
    if (!data?.boxes) return;
    const nextBoxes = sortBoxesNewestFirst(
      data.boxes.map((box) => ({
        ...box,
        weightKg: box.weightKg ?? 0,
      })),
    );
    setBoxes(nextBoxes);

    if (nextBoxes.length > 0) {
      initExpandFirst(nextBoxes[0]!.id, !nextBoxes[0]!.submitted);
    }

    if (data.editingBoxId) setEditingId(data.editingBoxId);
  }, [data, initExpandFirst, setEditingId]);

  const packageAttachment = detail?.packageAttachment ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '尾部记录',
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (packageAttachment.length === 0) {
              showToast('暂无包装要求', { duration: 2000 });
              return;
            }
            setPackagePreviewVisible(true);
          }}
          style={styles.headerRight}
        >
          <Text style={styles.headerRightText}>包装要求</Text>
        </Pressable>
      ),
    });
  }, [navigation, packageAttachment.length, showToast]);

  const addBox = async () => {
    const nextNo = boxes.reduce((max, box) => Math.max(max, box.boxNo), 0) + 1;
    const box: PackingBoxRecord = {
      id: `box-${Date.now()}`,
      boxNo: nextNo,
      weightKg: 0,
      sizeQuantities: emptySizeQuantities(sizes),
      submitted: false,
    };
    const next = [box, ...boxes];
    setExpandedIds((prev) => (prev.includes(box.id) ? prev : [box.id, ...prev]));
    await persist(next, box.id, true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const updateBox = (id: string, patch: Partial<PackingBoxRecord>) => {
    const next = boxes.map((box) => (box.id === id ? { ...box, ...patch } : box));
    void persist(next, editingId);
  };

  const deleteBox = async (id: string) => {
    if (boxes.length <= 1) return;
    const filtered = boxes.filter((box) => box.id !== id);
    const ascending = [...filtered].sort((a, b) => a.boxNo - b.boxNo);
    const renumbered = ascending.map((box, index) => ({ ...box, boxNo: index + 1 }));
    const next = sortBoxesNewestFirst(renumbered);
    await persist(next, editingId === id ? undefined : editingId, true);
    setExpandedIds((prev) => {
      const remaining = prev.filter((x) => x !== id);
      return remaining.length > 0 ? remaining : next[0] ? [next[0].id] : [];
    });
  };

  const openCartonSheet = (boxId: string) => {
    const box = boxes.find((item) => item.id === boxId);
    setCartonTargetBoxId(boxId);
    setPendingCartonId(box?.cartonSpecId);
    setCartonSheetVisible(true);
  };

  const confirmCarton = () => {
    if (!cartonTargetBoxId || !pendingCartonId) return;
    updateBox(cartonTargetBoxId, { cartonSpecId: pendingCartonId });
    setCartonSheetVisible(false);
    setCartonTargetBoxId(null);
    setPendingCartonId(undefined);
  };

  const handleSubmit = () => {
    void runSubmit(async () => {
      await flushPersist();
      const targets = boxes.filter((box) => !box.submitted || box.id === editingId);
      if (targets.length === 0) {
        showToast('没有可提交的箱子', { duration: 3000 });
        return;
      }
      try {
        const targetIds = targets.map((box) => box.id);
        await receivingService.submitPackingRecords(productionColorId, boxes, targetIds);
        setEditingId(undefined);
        collapseToFirst(boxes[0]?.id);
        await refresh();
        showToast('提交成功', { duration: 3000 });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'EMPTY_FORM') {
            showToast('不能提交空白表单！', { duration: 3000 });
          } else if (error.message === 'NO_CARTON') {
            showToast('箱子未添加尺寸！', { duration: 3000 });
          }
        }
      }
    });
  };

  const totals = useMemo(() => {
    const submitted = boxes.filter((b) => b.submitted);
    const source = submitted.length > 0 ? submitted : boxes;
    return {
      boxCount: source.length,
      pieceCount: source.reduce((sum, box) => sum + sumQuantities(box.sizeQuantities), 0),
    };
  }, [boxes]);

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
          <ReceivingBottomActionBar rightLabel="提交" onRightPress={handleSubmit} />
          <PackingCartonSheet
            visible={cartonSheetVisible}
            cartonSpecs={cartonSpecs}
            pendingCartonId={pendingCartonId}
            onSelect={setPendingCartonId}
            onClose={() => {
              setCartonSheetVisible(false);
              setCartonTargetBoxId(null);
              setPendingCartonId(undefined);
            }}
            onConfirm={confirmCarton}
          />
          <ReceivingImagePreview
            visible={packagePreviewVisible}
            imageKeys={packageAttachment}
            onClose={() => setPackagePreviewVisible(false)}
          />
        </>
      }
    >
      <ReceivingOrderInfoCard detail={detail} />

      <DashedButton
        icon={<AddIcon color="#105FC8" height={16} width={16} />}
        label="添加装箱记录"
        onPress={() => void addBox()}
        style={styles.dashedBtn}
      />

      {boxes.map((box) => {
        const expanded = expandedIds.includes(box.id);
        const isEditing = !box.submitted || editingId === box.id;
        const showEditBtn = expanded && box.submitted && editingId !== box.id;
        const spec = cartonSpecs.find((item) => item.id === box.cartonSpecId);
        const detailItems = sizes.map((size) => ({
          key: size,
          label: size,
          value: box.sizeQuantities.find((item) => item.size === size)?.quantity ?? 0,
        }));

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setEditingId(box.id);
                ensureExpanded(box.id);
              }}
              style={styles.editBtn}
            >
              <EditIcon color="#6C829E" height={16} width={16} />
              <Text style={styles.editText}>编辑</Text>
            </Pressable>
          );
        } else if (isEditing) {
          headerRight = (
            <View style={styles.headerActions}>
              {!spec ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => openCartonSheet(box.id)}
                >
                  <Text style={styles.linkText}>添加尺寸</Text>
                </Pressable>
              ) : null}
              {boxes.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => void deleteBox(box.id)}
                  style={styles.deleteBtn}
                >
                  <DeleteIcon height={16} width={16} />
                </Pressable>
              ) : null}
            </View>
          );
        }

        const subtitle = spec ? (
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText}>({formatCartonDim(spec)})</Text>
            {isEditing ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => openCartonSheet(box.id)}
              >
                <Text style={styles.linkText}>更换</Text>
              </Pressable>
            ) : null}
          </View>
        ) : undefined;

        return (
          <ExpandableRecordCard
            key={box.id}
            title="箱子"
            {...(subtitle ? { subtitle } : {})}
            expanded={expanded}
            onToggleExpand={() => toggleExpand(box.id)}
            {...(headerRight ? { headerRight } : {})}
          >
            {isEditing ? (
              <>
                <VStack gap={4}>
                  <Text style={styles.fieldLabel}>箱重(KG)</Text>
                  <QuantityStepper
                    allowDecimal
                    editable
                    onChange={(weightKg) => updateBox(box.id, { weightKg })}
                    onInputFocus={onInputFocus}
                    showStepLarge={false}
                    value={box.weightKg}
                  />
                </VStack>
                <ReceivingQuantityGrid
                  editable
                  onChange={(sizeQuantities) => updateBox(box.id, { sizeQuantities })}
                  onInputFocus={onInputFocus}
                  sizes={sizes}
                  values={box.sizeQuantities}
                />
              </>
            ) : (
              <RecordDetailPanel
                primaryLabel="箱重"
                primaryValue={`${box.weightKg}KG`}
                items={detailItems}
              />
            )}
          </ExpandableRecordCard>
        );
      })}

      <PackingSummaryCard boxCount={totals.boxCount} pieceCount={totals.pieceCount} />
    </ReceivingRecordsScrollShell>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerRight: {
    paddingRight: 16,
  },
  headerRightText: {
    color: '#105FC8',
    fontSize: 15,
  },
  dashedBtn: {
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  linkText: {
    color: '#105FC8',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 13,
    color: '#6B7A90',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
});
