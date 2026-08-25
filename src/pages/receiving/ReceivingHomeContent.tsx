import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from 'design-system-native';
import { type ComponentType, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  InteractionManager,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qrCodeScanImage } from '@/components/images';
import { PullToRefreshContainer } from '@/components/pullToRefresh';
import { SearchEntryBar } from '@/components/SearchEntryBar';
import { type ActionEntryKey, RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';
import { ROUTES } from '@/constants/routes';
import { useImageSourceAspectRatio } from '@/hooks/receiving/useImageSourceAspectRatio';
import { useSelectedProductionColor } from '@/hooks/receiving/useReceiving';
import { useReceivingHomePanel } from '@/hooks/receiving/useReceivingHomePanel';
import { useReceivingHomeStatusBar } from '@/hooks/receiving/useReceivingHomeStatusBar';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';
import type { LogisticsScreenProps } from '@/navigation/types';
import {
  PANEL_IMAGE_OVERLAP,
  TAB_CLEARANCE_BUFFER,
  TAB_FLOAT_BOTTOM_GAP,
  TOP_ZONE_HEIGHT,
} from '@/sections/receiving/home/panelLayout';
import { ReceivingHomeEmptyState } from '@/sections/receiving/home/ReceivingHomeEmptyState';
import { ReceivingHomeHero } from '@/sections/receiving/home/ReceivingHomeHero';
import {
  ReceivingHomePopover,
  ReceivingHomeSearchHeader,
} from '@/sections/receiving/home/ReceivingHomeSearchHeader';
import { ReceivingHomeSlidingPanel } from '@/sections/receiving/home/ReceivingHomeSlidingPanel';
import { ReceivingActionEntries } from '@/sections/receiving/ReceivingActionEntries';
import { ReceivingImagePreview } from '@/sections/receiving/ReceivingImagePreview';
import { ReceivingScreenBackground } from '@/sections/receiving/ReceivingScreenBackground';
import { getSafeAreaTopInset } from '@/utils/app';
import { resolveReceivingImage } from '@/utils/receiving/images';
import { formatSelectedSearchBarValue } from '@/utils/search/searchResultDisplay';

type ReceivingHomeContentProps = LogisticsScreenProps<'LogisticsHome'> & {
  onScanPress?: () => void;
  refreshToken?: number;
};

let homePopoverDismissedThisSession = false;

const ReceivingHomeContentComponent = ({
  navigation,
  onScanPress,
  refreshToken,
}: ReceivingHomeContentProps) => {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const tabBarHeightRaw = useBottomTabBarHeight();
  // TabBar 若被卸载，height 会掉成 0并触发整页重布局；锁定上次有效值避免堵死子页首屏。
  const lockedTabBarHeightRef = useRef(tabBarHeightRaw);
  if (tabBarHeightRaw > 0) {
    lockedTabBarHeightRef.current = tabBarHeightRaw;
  }
  const tabBarHeight = tabBarHeightRaw > 0 ? tabBarHeightRaw : lockedTabBarHeightRef.current;
  const window = useWindowDimensions();
  const topInset = getSafeAreaTopInset(insets.top);
  const bottomInset =
    Platform.OS === 'android' ? getAndroidGestureBottomInset(insets.bottom) : insets.bottom;

  const { data: selected, refresh } = useSelectedProductionColor();
  useReceivingHomeStatusBar(navigation, Boolean(selected));
  const [previewVisible, setPreviewVisible] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [popoverVisible, setPopoverVisible] = useState(!homePopoverDismissedThisSession);
  const [contentHeight, setContentHeight] = useState(0);
  const [ChromePrewarm, setChromePrewarm] = useState<ComponentType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const searchNavigatedRef = useRef(false);
  const scanNavigatedRef = useRef(false);

  const bottomReserve =
    tabBarHeight + Math.max(bottomInset, TAB_FLOAT_BOTTOM_GAP) + TAB_CLEARANCE_BUFFER;
  const usableContentHeight = Math.max(0, contentHeight - bottomReserve);

  /** 有样品图才展示远程/本地图；否则主图用未选中时的占位图 */
  const imageUrls = selected?.imageUrls;
  const hasSampleImage = Boolean(imageUrls?.length);
  const heroImages = useMemo(
    () => (imageUrls?.length ? imageUrls.map((key) => resolveReceivingImage(key)) : []),
    [imageUrls],
  );
  const heroPageCount = heroImages.length;
  const safeHeroIndex = Math.min(heroImageIndex, Math.max(heroPageCount - 1, 0));
  // 按当前样品图真实宽高比计算：宽铺满屏，并从状态栏下方开始，保证顶部完整可见
  const currentHeroSource = heroImages[safeHeroIndex];
  const imageAspect = useImageSourceAspectRatio(currentHeroSource);
  const imageNaturalHeight = hasSampleImage
    ? insets.top + window.width / imageAspect
    : TOP_ZONE_HEIGHT;

  const { panelOffset, panelLayout, panResponder } = useReceivingHomePanel({
    ...(selected?.id != null ? { selectedId: selected.id } : {}),
    usableContentHeight,
    imageNaturalHeight,
  });

  useEffect(() => {
    setHeroImageIndex(0);
  }, [selected?.id]);

  useFocusEffect(
    useCallback(() => {
      searchNavigatedRef.current = false;
      scanNavigatedRef.current = false;
      void refresh({ force: true });
    }, [refresh]),
  );

  // 首页首帧交互结束后立刻预热 lucide + 扫码框 PNG，避免进扫码页时冷挂载
  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      void import('design-system-native/qr-code-scanner')
        .then((mod) => {
          if (!cancelled) {
            const Prewarm = mod.QRCodeScannerChromePrewarm;
            setChromePrewarm(
              () =>
                function HostChromePrewarm() {
                  return <Prewarm scanFrameImage={qrCodeScanImage} />;
                },
            );
          }
        })
        .catch(() => {
          // 预热失败不影响主流程
        });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, []);

  const goScan = useCallback(() => {
    if (scanNavigatedRef.current) return;
    scanNavigatedRef.current = true;
    if (onScanPress) {
      onScanPress();
      return;
    }
    navigation.navigate(ROUTES.LOGISTICS.QR_SCAN);
  }, [navigation, onScanPress]);

  const goSearch = useCallback(() => {
    if (searchNavigatedRef.current) return;
    searchNavigatedRef.current = true;
    navigation.navigate(ROUTES.LOGISTICS.SEARCH);
  }, [navigation]);

  useEffect(() => {
    if (refreshToken) {
      void refresh({ force: true });
    }
  }, [refresh, refreshToken]);

  /** 有选中生产色时下拉：强制重拉当前生产单详情（含各模块统计） */
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh({ silent: true, force: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleDismissPopover = useCallback(() => {
    homePopoverDismissedThisSession = true;
    setPopoverVisible(false);
  }, []);

  const navigateEntry = (key: ActionEntryKey) => {
    if (!selected) return;
    const map = {
      material: ROUTES.LOGISTICS.MATERIAL_CONFIRMATION,
      cutting: ROUTES.LOGISTICS.CUTTING_RECORDS,
      sewing: ROUTES.LOGISTICS.SEWING_RECORDS,
      packing: ROUTES.LOGISTICS.PACKING_RECORDS,
    } as const;
    navigation.navigate(map[key], { productionColorId: selected.id });
  };

  const selectedSearchValue = selected
    ? formatSelectedSearchBarValue({
        productCode: selected.productCode,
        color: selected.color,
        brand: selected.brand,
      })
    : undefined;

  const searchBar = (
    <SearchEntryBar
      onScanPress={goScan}
      onSearchPress={goSearch}
      onSearchPressIn={goSearch}
      {...(selectedSearchValue ? { value: selectedSearchValue } : {})}
    />
  );

  if (!selected) {
    return (
      <ReceivingHomeEmptyState
        bottomReserve={bottomReserve}
        onDisabledPress={() => toast.show({ title: '请先扫描或搜索生产二维码', duration: 3000 })}
        searchHeader={
          <ReceivingHomeSearchHeader
            searchBar={searchBar}
            {...(popoverVisible
              ? { popover: <ReceivingHomePopover onClose={handleDismissPopover} /> }
              : {})}
          />
        }
      />
    );
  }

  const heroWrapHeight = panelOffset.interpolate({
    inputRange: panelLayout ? [panelLayout.minPanelTop, panelLayout.maxPanelTop] : [0, 1],
    outputRange: panelLayout
      ? [
          panelLayout.minPanelTop + PANEL_IMAGE_OVERLAP,
          panelLayout.maxPanelTop + PANEL_IMAGE_OVERLAP,
        ]
      : [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <ReceivingScreenBackground />
      <View pointerEvents="none" style={[styles.bottomFill, { height: bottomReserve }]} />
      <View style={styles.selectedBody}>
        {/*
          与订单查询页同款：整页（含搜索栏）一起下拉，指示器停在安全区下方。
          滑动面板放在容器外，避免 RNGH Pan 抢走入口区下滑手势。
        */}
        <PullToRefreshContainer
          enabled
          isRefreshing={isRefreshing}
          onRefresh={handlePullRefresh}
          topInset={topInset}
        >
          <View
            style={styles.contentArea}
            onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
          >
            {panelLayout ? (
              <Animated.View style={[styles.heroWrap, { height: heroWrapHeight }]}>
                <ReceivingHomeHero
                  hasSampleImage={hasSampleImage}
                  heroImages={heroImages}
                  windowWidth={window.width}
                  contentTopInset={insets.top}
                  productCode={selected.productCode}
                  color={selected.color}
                  brand={selected.brand}
                  safeHeroIndex={safeHeroIndex}
                  onHeroIndexChange={setHeroImageIndex}
                  onPressImage={() => setPreviewVisible(true)}
                />
              </Animated.View>
            ) : null}
          </View>
          <ReceivingHomeSearchHeader absolute searchBar={searchBar} />
        </PullToRefreshContainer>

        {panelLayout ? (
          <ReceivingHomeSlidingPanel
            top={panelOffset}
            bottomReserve={bottomReserve}
            {...(panResponder ? { panHandlers: panResponder.panHandlers } : {})}
          >
            <ReceivingActionEntries summary={selected} onPressEntry={navigateEntry} />
          </ReceivingHomeSlidingPanel>
        ) : null}
      </View>

      <ReceivingImagePreview
        visible={previewVisible && hasSampleImage}
        imageKeys={selected.imageUrls}
        initialIndex={safeHeroIndex}
        onClose={() => setPreviewVisible(false)}
      />
      {ChromePrewarm ? <ChromePrewarm /> : null}
    </View>
  );
};

/** memo：父级 LogisticsHomePage 因 useIsFocused 重渲时，避免重型首页树跟着 commit（NavPerf 显示可卡 8s+） */
export const ReceivingHomeContent = memo(ReceivingHomeContentComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
  },
  bottomFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
  },
  selectedBody: {
    flex: 1,
    position: 'relative',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
});
