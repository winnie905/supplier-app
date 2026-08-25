import { useHeaderHeight } from '@react-navigation/elements';
import { designTokens, useToast } from 'design-system-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { EMPTY_FORM_SUBMIT_MESSAGE, MATERIAL_EXCEPTION_TYPES } from '@/constants/receiving';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import {
  ExceptionReportButton,
  useExceptionReportChrome,
} from '@/hooks/receiving/useExceptionReportChrome';
import { useMaterialConfirmation, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import { useStickyCategoryTabs } from '@/hooks/receiving/useStickyCategoryTabs';
import type { LogisticsScreenProps } from '@/navigation/types';
import { MaterialCategorySection } from '@/sections/receiving/material/MaterialCategorySection';
import { CircleCheck } from '@/sections/receiving/material/MaterialItemRow';
import {
  AlignedReceivingBackdrop,
  PROGRESS_PANEL_RADIUS,
  ProgressPanelBorder,
  ProgressPanelChrome,
} from '@/sections/receiving/material/MaterialProgressChrome';
import { MaterialTabBar } from '@/sections/receiving/material/MaterialTabBar';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingExceptionSheet } from '@/sections/receiving/ReceivingExceptionSheet';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { receivingService } from '@/services/receiving/receivingService';
import type { MaterialCategory, MaterialItem } from '@/types/receiving';
import { formatPendingExceptionTypesByItemId } from '@/utils/receiving/exceptions';
import { submitExceptionReport } from '@/utils/receiving/submitExceptionReport';

type MaterialConfirmationPageProps = LogisticsScreenProps<'MaterialConfirmation'>;

const TAB_ORDER: MaterialCategory[] = ['fabric', 'packaging', 'data_package'];

const TAB_LABELS: Record<MaterialCategory, string> = {
  fabric: '面辅料',
  packaging: '包装辅料',
  data_package: '资料包',
};

/** 面辅料下主料/里料合并为一个小标题 */
const FABRIC_MERGED_GROUP_TITLE = '主料/里料';
const FABRIC_MERGE_GROUP_NAMES = new Set(['主料', '里料']);

const resolveMaterialGroupKey = (category: MaterialCategory, groupName: string) => {
  if (category === 'fabric' && FABRIC_MERGE_GROUP_NAMES.has(groupName.trim())) {
    return FABRIC_MERGED_GROUP_TITLE;
  }
  return groupName;
};

export const MaterialConfirmationPage = ({ navigation, route }: MaterialConfirmationPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { height: screenHeight } = useWindowDimensions();
  const toast = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail, refresh: refreshDetail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useMaterialConfirmation(productionColorId);
  const {
    exceptions,
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
    module: 'material',
    allowedTypes: MATERIAL_EXCEPTION_TYPES,
  });
  const exceptionLabelByItemId = useMemo(
    () => formatPendingExceptionTypesByItemId(exceptions, MATERIAL_EXCEPTION_TYPES),
    [exceptions],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressLeadSize, setProgressLeadSize] = useState({ width: 0, height: 0 });
  const [progressPanelSize, setProgressPanelSize] = useState({ width: 0, height: 0 });

  const {
    scrollRef,
    activeTab,
    tabPinned,
    onContainerLayout,
    onTabBarLayout,
    onSectionsWrapLayout,
    onSectionLayout,
    scrollToCategory,
    onScroll,
    endProgrammaticTabScroll,
  } = useStickyCategoryTabs<MaterialCategory>({
    categories: TAB_ORDER,
    initialCategory: 'fabric',
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const tabItems = useMemo(
    () =>
      TAB_ORDER.map((key) => ({
        key,
        label: `${TAB_LABELS[key]}(${items.filter((item) => item.category === key).length})`,
      })),
    [items],
  );

  const sections = useMemo(() => {
    return TAB_ORDER.map((category) => {
      const categoryItems = items.filter((item) => item.category === category);
      const groups = new Map<string, MaterialItem[]>();
      categoryItems.forEach((item) => {
        const groupKey = resolveMaterialGroupKey(category, item.groupName);
        const list = groups.get(groupKey) ?? [];
        list.push(item);
        groups.set(groupKey, list);
      });
      return {
        category,
        title: TAB_LABELS[category],
        groups: Array.from(groups.entries()),
        ids: categoryItems.map((item) => item.id),
      };
    }).filter((section) => section.ids.length > 0);
  }, [items]);

  const selectableIds = useMemo(
    () => items.filter((item) => !item.statuses.includes('arrived')).map((item) => item.id),
    [items],
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSection = useCallback(
    (ids: string[]) => {
      const targets = ids.filter((id) => {
        const item = items.find((x) => x.id === id);
        return item && !item.statuses.includes('arrived');
      });
      if (targets.length === 0) return;
      const allOn = targets.every((id) => selectedIds.includes(id));
      if (allOn) {
        setSelectedIds((prev) => prev.filter((id) => !targets.includes(id)));
      } else {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...targets])));
      }
    },
    [items, selectedIds],
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedIds(selectableIds);
    }
  }, [allSelected, selectableIds]);

  const handleOpenExceptionSheet = () => {
    if (selectedIds.length === 0) {
      toast.show({ title: EMPTY_FORM_SUBMIT_MESSAGE, duration: 3000 });
      return;
    }
    openExceptionSheet();
  };

  const handleConfirmArrival = () => {
    void runSubmit(async () => {
      if (selectedIds.length === 0) {
        toast.show({ title: '请先选择物料', duration: 3000 });
        return;
      }
      await receivingService.submitMaterialArrival(productionColorId, selectedIds);
      setSelectedIds([]);
      await refresh();
      await refreshDetail();
      await refreshExceptions();
      toast.show({ title: '确认到料成功', duration: 3000 });
    });
  };

  const handleSubmitException = () => {
    void runSubmit(() =>
      submitExceptionReport({
        exceptionTypes,
        toast,
        precheck: () => (selectedIds.length === 0 ? '请先选择物料' : null),
        submit: async () => {
          await receivingService.submitMaterialException({
            productionColorId,
            itemIds: selectedIds,
            type: exceptionTypes.join('、'),
            description: exceptionDesc,
          });
        },
        closeExceptionSheet,
        resetExceptionForm,
        afterSuccess: async () => {
          setSelectedIds([]);
          await refresh();
          await refreshDetail();
          await refreshExceptions();
        },
      }),
    );
  };

  if (!detail || !data) {
    return <View style={styles.root} />;
  }

  const progress = Number(data.progressPercent.toFixed(2));
  const selectedTags = items
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.name);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        // 视口从 header 下方开始：上滑内容在 header 底边裁切消失，不会穿过透明 header
        style={[styles.scrollView, { marginTop: headerHeight }]}
        contentContainerStyle={styles.scroll}
        onScroll={(event) => onScroll(event, sections[0]?.category ?? 'fabric')}
        onMomentumScrollEnd={endProgrammaticTabScroll}
        scrollEventThrottle={16}
      >
        <ReceivingOrderInfoCard detail={detail} />

        <View
          style={styles.progressContainer}
          onLayout={(event) => {
            const { y, width, height } = event.nativeEvent.layout;
            onContainerLayout(y);
            setProgressPanelSize((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height },
            );
          }}
        >
          <ProgressPanelBorder width={progressPanelSize.width} height={progressPanelSize.height} />

          <View
            style={styles.progressLead}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setProgressLeadSize((prev) =>
                prev.width === width && prev.height === height ? prev : { width, height },
              );
            }}
          >
            {progressLeadSize.width > 0 && progressLeadSize.height > 0 ? (
              <ProgressPanelChrome
                width={progressLeadSize.width}
                height={progressLeadSize.height}
              />
            ) : null}
            <View style={styles.progressBar}>
              <Text style={styles.progressLabel}>齐套进度</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>
          </View>

          <View
            style={[styles.tabBarSticky, tabPinned && styles.tabBarPlaceholder]}
            onLayout={onTabBarLayout}
          >
            <MaterialTabBar tabs={tabItems} activeTab={activeTab} onTabPress={scrollToCategory} />
          </View>

          <View style={styles.sectionsWrap} onLayout={onSectionsWrapLayout}>
            {sections.map((section) => {
              const sectionSelectable = section.ids.filter((id) => {
                const item = items.find((x) => x.id === id);
                return item && !item.statuses.includes('arrived');
              });
              const sectionChecked =
                sectionSelectable.length > 0 &&
                sectionSelectable.every((id) => selectedIds.includes(id));

              return (
                <MaterialCategorySection
                  key={section.category}
                  category={section.category}
                  title={section.title}
                  groups={section.groups}
                  sectionChecked={sectionChecked}
                  selectedIds={selectedIds}
                  exceptionLabelByItemId={exceptionLabelByItemId}
                  onToggleSection={() => toggleSection(section.ids)}
                  onToggleItem={toggleSelect}
                  onLayout={(event) => onSectionLayout(section.category, event)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {tabPinned ? (
        <View style={[styles.tabBarPinned, { top: headerHeight }]}>
          <AlignedReceivingBackdrop screenHeight={screenHeight} topOffset={headerHeight} />
          <MaterialTabBar tabs={tabItems} activeTab={activeTab} onTabPress={scrollToCategory} />
        </View>
      ) : null}

      <ReceivingBottomActionBar
        left={
          <Pressable accessibilityRole="checkbox" onPress={toggleAll} style={styles.selectAll}>
            <CircleCheck checked={allSelected} />
            <Text style={styles.selectAllText}>全选</Text>
          </Pressable>
        }
        center={
          <ExceptionReportButton onPress={handleOpenExceptionSheet} style={styles.exceptionBtn} />
        }
        rightLabel={`确认到料 (${selectedIds.length})`}
        onRightPress={handleConfirmArrival}
      />

      <ReceivingExceptionSheet
        visible={exceptionVisible}
        tags={selectedTags}
        types={MATERIAL_EXCEPTION_TYPES}
        selectedTypes={exceptionTypes}
        description={exceptionDesc}
        selectionMode="single"
        onClose={closeExceptionSheet}
        onDescriptionChange={setExceptionDesc}
        onTypesChange={setExceptionTypes}
        onSubmit={handleSubmitException}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  progressContainer: {
    backgroundColor: '#ECF4FF',
    alignSelf: 'stretch',
    // 内容不足一屏时也撑到底，避免底部漏出页面灰白底色
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 12,
    gap: 12,
    borderTopLeftRadius: PROGRESS_PANEL_RADIUS,
    borderTopRightRadius: PROGRESS_PANEL_RADIUS,
    paddingTop: 16,
  },
  progressLead: {
    overflow: 'hidden',
  },
  progressBar: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2A85FF',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.gray[0],
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: designTokens.colors.gray[0],
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: designTokens.colors.gray[0],
  },
  tabBarSticky: {},
  tabBarPlaceholder: {
    opacity: 0,
  },
  tabBarPinned: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  sectionsWrap: {
    alignSelf: 'stretch',
    paddingBottom: 24,
    gap: 12,
    overflow: 'visible',
  },
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  selectAllText: {
    fontSize: 16,
    color: '#021626',
    fontWeight: '600',
  },
  exceptionBtn: {
    minWidth: 96,
    paddingHorizontal: 14,
  },
});
