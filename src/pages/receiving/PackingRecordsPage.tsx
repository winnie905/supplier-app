import { useHeaderHeight } from '@react-navigation/elements';
import { designTokens, useToast, VStack } from 'design-system-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AddIcon from '@/assets/icons/circlePlusOutline.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import { DashedButton } from '@/components/DashedButton';
import { ExpandableRecordCard } from '@/components/ExpandableRecordCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RecordDetailPanel, toSizeDetailItems } from '@/components/RecordDetailPanel';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import { useKeyboardAwareScroll } from '@/hooks/receiving/useKeyboardAwareScroll';
import { usePackingRecords, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import { useRecordsSubmit } from '@/hooks/receiving/useRecordsSubmit';
import { useSyncedExpandableRecords } from '@/hooks/receiving/useSyncedExpandableRecords';
import type { LogisticsScreenProps } from '@/navigation/types';
import { PackingCartonSheet } from '@/sections/receiving/packing/PackingCartonSheet';
import { PackingSummaryCard } from '@/sections/receiving/packing/PackingSummaryCard';
import { formatCartonDim, sortBoxesNewestFirst } from '@/sections/receiving/packing/utils';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingImagePreview } from '@/sections/receiving/ReceivingImagePreview';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { ReceivingQuantityGrid } from '@/sections/receiving/ReceivingQuantityGrid';
import { ReceivingRecordsScrollShell } from '@/sections/receiving/ReceivingRecordsScrollShell';
import { ReceivingStatusBadge } from '@/sections/receiving/ReceivingStatusBadge';
import { RecordCardEditButton } from '@/sections/receiving/RecordCardEditButton';
import {
  emptySizeQuantities,
  receivingService,
  sizeNamesFromRange,
  sumQuantities,
} from '@/services/receiving/receivingService';
import type { CartonSpec, PackingBoxRecord } from '@/types/receiving';

type PackingRecordsPageProps = LogisticsScreenProps<'PackingRecords'>;

export const PackingRecordsPage = ({ navigation, route }: PackingRecordsPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const toast = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = usePackingRecords(productionColorId);
  const { scrollRef, onInputFocus, onScroll, contentBottomInset, rootKeyboardInset } =
    useKeyboardAwareScroll();

  const [cartonSheetVisible, setCartonSheetVisible] = useState(false);
  const [cartonTargetBoxId, setCartonTargetBoxId] = useState<string | null>(null);
  const [pendingCartonId, setPendingCartonId] = useState<string | undefined>();
  const [packagePreviewVisible, setPackagePreviewVisible] = useState(false);

  const sizes = useMemo(
    () => data?.sizes ?? (detail ? sizeNamesFromRange(detail.sizeRange) : []),
    [data?.sizes, detail],
  );
  const [cartonSpecs, setCartonSpecs] = useState<CartonSpec[]>([]);

  useEffect(() => {
    let cancelled = false;
    void receivingService
      .getCartonSpecsForProductionColor(productionColorId)
      .then((list) => {
        if (!cancelled) setCartonSpecs(list);
      })
      .catch(() => {
        if (!cancelled) {
          setCartonSpecs([]);
          toast.show({ title: '箱规加载失败', duration: 3000 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productionColorId, toast]);

  const getApiRecords = useCallback(
    (payload: NonNullable<typeof data>) =>
      payload.boxes.map((box) => ({
        ...box,
        weightKg: box.weightKg ?? 0,
      })),
    [],
  );
  const alsoEditFirst = useCallback((first: PackingBoxRecord) => !first.submitted, []);
  const ensureSeed = useCallback(
    (list: PackingBoxRecord[], seedOnce: () => boolean): PackingBoxRecord[] | null => {
      // 无装箱记录时补一条空箱草稿（仅内存），便于直接填写
      if (list.length > 0 || sizes.length === 0 || !seedOnce()) return null;
      return [
        {
          id: `local-${Date.now()}`,
          boxNo: 1,
          weightKg: 0,
          sizeQuantities: emptySizeQuantities(sizes),
          submitted: false,
        },
      ];
    },
    [sizes],
  );

  const {
    records: boxes,
    persistRecords: persistBoxes,
    resetSyncGuards,
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
    sortRecords: sortBoxesNewestFirst,
    ensureSeed,
    alsoEditFirst,
    persistEditingId: true,
    clearEditingOnSync: true,
  });

  const packageAttachment = detail?.packageAttachment ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '尾部记录',
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (packageAttachment.length === 0) {
              toast.show({ title: '暂无包装要求', duration: 2000 });
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
  }, [navigation, packageAttachment.length, toast]);

  const addBox = () => {
    const nextNo = boxes.reduce((max, box) => Math.max(max, box.boxNo), 0) + 1;
    const box: PackingBoxRecord = {
      id: `local-${Date.now()}`,
      boxNo: nextNo,
      weightKg: 0,
      sizeQuantities: emptySizeQuantities(sizes),
      submitted: false,
    };
    const next = [box, ...boxes];
    setExpandedIds((prev) => (prev.includes(box.id) ? prev : [box.id, ...prev]));
    persistBoxes(next, box.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const updateBox = (id: string, patch: Partial<PackingBoxRecord>) => {
    persistBoxes(
      boxes.map((box) => (box.id === id ? { ...box, ...patch } : box)),
      editingId,
    );
  };

  const deleteBox = (id: string) => {
    if (boxes.length <= 1) return;
    const filtered = boxes.filter((box) => box.id !== id);
    const ascending = [...filtered].sort((a, b) => a.boxNo - b.boxNo);
    const renumbered = ascending.map((box, index) => ({ ...box, boxNo: index + 1 }));
    const next = sortBoxesNewestFirst(renumbered);
    persistBoxes(next, editingId === id ? undefined : editingId);
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
    const spec = cartonSpecs.find((item) => item.id === pendingCartonId);
    updateBox(cartonTargetBoxId, {
      cartonSpecId: pendingCartonId,
      ...(spec
        ? {
            cartonSpecType: spec.type,
            cartonSpecName: spec.name,
            cartonSpecUnit: spec.unit,
            cartonSpecLength: spec.length,
            cartonSpecWidth: spec.width,
            cartonSpecHeight: spec.height,
          }
        : {}),
    });
    setCartonSheetVisible(false);
    setCartonTargetBoxId(null);
    setPendingCartonId(undefined);
  };

  const hasRemovedSubmittedBoxes = useMemo(() => {
    const localIds = new Set(boxes.map((box) => box.id));
    return (data?.boxes ?? []).some((box) => !localIds.has(box.id));
  }, [boxes, data?.boxes]);

  const handleSubmit = useRecordsSubmit({
    records: boxes,
    editingId,
    setEditingId,
    collapseToFirst,
    resetSyncGuards,
    refresh,
    runSubmit,
    allowSubmitWithoutTargets: hasRemovedSubmittedBoxes,
    submit: (targetIds) => {
      const ids = hasRemovedSubmittedBoxes
        ? targetIds.filter((id) => {
            const box = boxes.find((item) => item.id === id);
            return Boolean(box?.cartonSpecId) && sumQuantities(box?.sizeQuantities ?? []) > 0;
          })
        : targetIds;
      return receivingService.submitPackingRecords(productionColorId, boxes, ids);
    },
    errorMessages: {
      NO_CARTON: '箱子未添加尺寸！',
    },
  });

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
        icon={<AddIcon color={designTokens.colors.brand[500]} height={16} width={16} />}
        label="添加装箱记录"
        onPress={addBox}
        style={styles.dashedBtn}
      />

      {boxes.map((box) => {
        const expanded = expandedIds.includes(box.id);
        const isEditing = !box.submitted || editingId === box.id;
        const showEditBtn = expanded && box.submitted && editingId !== box.id;
        const spec = cartonSpecs.find((item) => item.id === box.cartonSpecId);
        const detailItems = toSizeDetailItems(sizes, box.sizeQuantities);

        let headerRight: ReactNode | undefined;
        if (showEditBtn) {
          headerRight = (
            <RecordCardEditButton
              onPress={() => {
                setEditingId(box.id);
                ensureExpanded(box.id);
              }}
            />
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
                  onPress={() => deleteBox(box.id)}
                  style={styles.deleteBtn}
                >
                  <DeleteIcon height={16} width={16} />
                </Pressable>
              ) : null}
            </View>
          );
        }

        const specType = spec?.type ?? box.cartonSpecType;
        const subtitle = spec ? (
          <View style={styles.subtitleRow}>
            {specType ? (
              <ReceivingStatusBadge
                compact
                outline
                label={specType === 'brand' ? '品牌' : '通用'}
                tone={specType === 'brand' ? 'green' : 'orange'}
              />
            ) : null}
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
    color: designTokens.colors.brand[500],
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
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  linkText: {
    color: designTokens.colors.brand[500],
    fontSize: 14,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 17,
    color: '#061B37',
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
});
