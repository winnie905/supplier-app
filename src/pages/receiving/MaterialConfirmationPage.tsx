import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useToast } from '@/components/toast/Toast';
import { MATERIAL_EXCEPTION_TYPES } from '@/constants/receiving';
import { useDebouncedSubmit } from '@/hooks/receiving/useDebouncedSubmit';
import {
  ExceptionReportButton,
  useExceptionReportChrome,
} from '@/hooks/receiving/useExceptionReportChrome';
import { useMaterialConfirmation, useProductionColorDetail } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { MaterialCategorySection } from '@/sections/receiving/material/MaterialCategorySection';
import { CircleCheck } from '@/sections/receiving/material/MaterialItemRow';
import {
  AlignedReceivingBackdrop,
  PROGRESS_PANEL_RADIUS,
  ProgressPanelChrome,
} from '@/sections/receiving/material/MaterialProgressChrome';
import { MaterialTabBar } from '@/sections/receiving/material/MaterialTabBar';
import { ReceivingBottomActionBar } from '@/sections/receiving/ReceivingBottomActionBar';
import { ReceivingExceptionSheet } from '@/sections/receiving/ReceivingExceptionSheet';
import { ReceivingOrderInfoCard } from '@/sections/receiving/ReceivingOrderInfoCard';
import { receivingService } from '@/services/receiving/receivingService';
import type { MaterialCategory, MaterialItem } from '@/types/receiving';

type MaterialConfirmationPageProps = LogisticsScreenProps<'MaterialConfirmation'>;

const TAB_ORDER: MaterialCategory[] = ['fabric', 'packaging', 'data_package'];

const TAB_LABELS: Record<MaterialCategory, string> = {
  fabric: '面辅料',
  packaging: '包装辅料',
  data_package: '资料包',
};

export const MaterialConfirmationPage = ({ navigation, route }: MaterialConfirmationPageProps) => {
  const { productionColorId } = route.params;
  const headerHeight = useHeaderHeight();
  const { height: screenHeight } = useWindowDimensions();
  const { showToast } = useToast();
  const runSubmit = useDebouncedSubmit();
  const { detail, refresh: refreshDetail } = useProductionColorDetail(productionColorId);
  const { data, refresh } = useMaterialConfirmation(productionColorId);
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
    module: 'material',
    allowedTypes: MATERIAL_EXCEPTION_TYPES,
  });
  const [activeTab, setActiveTab] = useState<MaterialCategory>('fabric');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressLeadSize, setProgressLeadSize] = useState({ width: 0, height: 0 });
  const [tabPinned, setTabPinned] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const sectionLocalY = useRef<Partial<Record<MaterialCategory, number>>>({});
  const progressContainerYRef = useRef(0);
  const tabBarLocalYRef = useRef(0);
  const sectionsWrapLocalYRef = useRef(0);
  const tabBarYRef = useRef(0);
  const tabBarHeightRef = useRef(0);
  const scrollingToTab = useRef(false);

  const syncTabBarContentY = () => {
    tabBarYRef.current = progressContainerYRef.current + tabBarLocalYRef.current;
  };

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
        const list = groups.get(item.groupName) ?? [];
        list.push(item);
        groups.set(item.groupName, list);
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

  const handleConfirmArrival = () => {
    void runSubmit(async () => {
      if (selectedIds.length === 0) {
        showToast('请先选择物料', { duration: 3000 });
        return;
      }
      await receivingService.submitMaterialArrival(productionColorId, selectedIds);
      setSelectedIds([]);
      await refresh();
      await refreshDetail();
      await refreshExceptions();
      showToast('确认到料成功', { duration: 3000 });
    });
  };

  const handleSubmitException = () => {
    void runSubmit(async () => {
      if (selectedIds.length === 0) {
        showToast('请先选择物料', { duration: 3000 });
        return;
      }
      if (exceptionTypes.length === 0) {
        showToast('请选择异常类型', { duration: 3000 });
        return;
      }
      await receivingService.submitMaterialException({
        productionColorId,
        itemIds: selectedIds,
        type: exceptionTypes.join('、'),
        description: exceptionDesc,
      });
      closeExceptionSheet();
      resetExceptionForm();
      setSelectedIds([]);
      await refresh();
      await refreshDetail();
      await refreshExceptions();
      showToast('异常已提交', { duration: 3000 });
    });
  };

  const onSectionLayout = (category: MaterialCategory, event: LayoutChangeEvent) => {
    sectionLocalY.current[category] = event.nativeEvent.layout.y;
  };

  const sectionContentY = (category: MaterialCategory) => {
    const localY = sectionLocalY.current[category];
    if (localY == null) return null;
    return progressContainerYRef.current + sectionsWrapLocalYRef.current + localY;
  };

  const scrollToCategory = (category: MaterialCategory) => {
    setActiveTab(category);
    const sectionY = sectionContentY(category);
    if (sectionY == null) return;
    scrollingToTab.current = true;
    // 至少滚到 Tab 吸附位置；再对齐到对应分区（分区顶在吸附 Tab 下方）
    const target = Math.max(tabBarYRef.current, sectionY - tabBarHeightRef.current);
    scrollRef.current?.scrollTo({
      y: Math.max(0, target),
      animated: true,
    });
    setTabPinned(true);
    setTimeout(() => {
      scrollingToTab.current = false;
    }, 360);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldPin = offsetY >= tabBarYRef.current;
    setTabPinned((prev) => (prev === shouldPin ? prev : shouldPin));

    if (scrollingToTab.current) return;
    const y = offsetY + tabBarHeightRef.current + 8;
    let current: MaterialCategory = 'fabric';
    for (const key of TAB_ORDER) {
      const offset = sectionContentY(key);
      if (offset != null && y >= offset) {
        current = key;
      }
    }
    if (current !== activeTab) {
      setActiveTab(current);
    }
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
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <ReceivingOrderInfoCard cornerTag={cornerTag} detail={detail} />

        <View
          style={styles.progressContainer}
          onLayout={(event) => {
            progressContainerYRef.current = event.nativeEvent.layout.y;
            syncTabBarContentY();
          }}
        >
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
            onLayout={(event) => {
              tabBarLocalYRef.current = event.nativeEvent.layout.y;
              tabBarHeightRef.current = event.nativeEvent.layout.height;
              syncTabBarContentY();
            }}
          >
            <MaterialTabBar tabs={tabItems} activeTab={activeTab} onTabPress={scrollToCategory} />
          </View>

          <View
            style={styles.sectionsWrap}
            onLayout={(event) => {
              sectionsWrapLocalYRef.current = event.nativeEvent.layout.y;
            }}
          >
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
        center={<ExceptionReportButton onPress={openExceptionSheet} style={styles.exceptionBtn} />}
        rightLabel={`确认到料 (${selectedIds.length})`}
        onRightPress={handleConfirmArrival}
      />

      <ReceivingExceptionSheet
        visible={exceptionVisible}
        tags={selectedTags}
        types={MATERIAL_EXCEPTION_TYPES}
        selectedTypes={exceptionTypes}
        description={exceptionDesc}
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
    paddingBottom: 108,
  },
  progressContainer: {
    backgroundColor: '#ECF4FF',
    alignSelf: 'stretch',
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
