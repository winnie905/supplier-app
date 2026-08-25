import { useCallback, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

interface UseStickyCategoryTabsParams<T extends string> {
  /** Tab 顺序，与页面分区顺序一致 */
  categories: readonly T[];
  /** 初始选中的 Tab */
  initialCategory: T;
}

/**
 * 物料确认页的吸顶 Tab 联动：滚动时反查当前分区、点击 Tab 滚到分区。
 *
 * 分区 y 坐标由三段 onLayout 拼出（容器 → 分区容器 → 分区），
 * 点击 Tab 期间用 `scrollingToTab` 锁住 onScroll 回写，避免选中态来回跳。
 */
export const useStickyCategoryTabs = <T extends string>({
  categories,
  initialCategory,
}: UseStickyCategoryTabsParams<T>) => {
  const [activeTab, setActiveTab] = useState<T>(initialCategory);
  const [tabPinned, setTabPinned] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const sectionLocalY = useRef<Partial<Record<T, number>>>({});
  const containerYRef = useRef(0);
  const tabBarLocalYRef = useRef(0);
  const sectionsWrapLocalYRef = useRef(0);
  const tabBarYRef = useRef(0);
  const tabBarHeightRef = useRef(0);
  /** 点击 Tab 程序化滚动期间，禁止 onScroll 回写选中态，避免来回跳 */
  const scrollingToTab = useRef(false);
  const pendingTabRef = useRef<T | null>(null);
  const scrollLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const syncTabBarContentY = () => {
    tabBarYRef.current = containerYRef.current + tabBarLocalYRef.current;
  };

  const endProgrammaticTabScroll = useCallback(() => {
    if (!scrollingToTab.current) {
      return;
    }
    if (scrollLockTimerRef.current) {
      clearTimeout(scrollLockTimerRef.current);
      scrollLockTimerRef.current = null;
    }
    if (pendingTabRef.current != null) {
      setActiveTab(pendingTabRef.current);
      activeTabRef.current = pendingTabRef.current;
    }
    pendingTabRef.current = null;
    scrollingToTab.current = false;
  }, []);

  const beginProgrammaticTabScroll = useCallback(
    (category: T) => {
      scrollingToTab.current = true;
      pendingTabRef.current = category;
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current);
      }
      // 兜底：部分机型 animated scrollTo 不一定触发 momentum end
      scrollLockTimerRef.current = setTimeout(() => {
        endProgrammaticTabScroll();
      }, 600);
    },
    [endProgrammaticTabScroll],
  );

  const sectionContentY = (category: T) => {
    const localY = sectionLocalY.current[category];
    if (localY == null) return null;
    return containerYRef.current + sectionsWrapLocalYRef.current + localY;
  };

  /** 分区容器（Tab 上方的整块面板）的 y，与面板尺寸一起在页面里读取 */
  const onContainerLayout = (y: number) => {
    containerYRef.current = y;
    syncTabBarContentY();
  };

  const onTabBarLayout = (event: LayoutChangeEvent) => {
    tabBarLocalYRef.current = event.nativeEvent.layout.y;
    tabBarHeightRef.current = event.nativeEvent.layout.height;
    syncTabBarContentY();
  };

  const onSectionsWrapLayout = (event: LayoutChangeEvent) => {
    sectionsWrapLocalYRef.current = event.nativeEvent.layout.y;
  };

  const onSectionLayout = (category: T, event: LayoutChangeEvent) => {
    sectionLocalY.current[category] = event.nativeEvent.layout.y;
  };

  const scrollToCategory = (category: T) => {
    setActiveTab(category);
    activeTabRef.current = category;
    const sectionY = sectionContentY(category);
    if (sectionY == null) return;
    beginProgrammaticTabScroll(category);
    // 至少滚到 Tab 吸附位置；再对齐到对应分区（分区顶在吸附 Tab 下方）
    const target = Math.max(tabBarYRef.current, sectionY - tabBarHeightRef.current);
    scrollRef.current?.scrollTo({
      y: Math.max(0, target),
      animated: true,
    });
    setTabPinned(true);
  };

  /** fallbackCategory：所有分区都在视口下方时的兜底选中项 */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>, fallbackCategory: T) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldPin = offsetY >= tabBarYRef.current;
    setTabPinned((prev) => (prev === shouldPin ? prev : shouldPin));

    if (scrollingToTab.current) {
      return;
    }

    const y = offsetY + tabBarHeightRef.current + 8;
    let current = fallbackCategory;
    for (const key of categories) {
      const offset = sectionContentY(key);
      if (offset != null && y >= offset) {
        current = key;
      }
    }
    if (current !== activeTabRef.current) {
      activeTabRef.current = current;
      setActiveTab(current);
    }
  };

  return {
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
  };
};
