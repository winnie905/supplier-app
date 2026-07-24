import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, Text } from 'design-system-native';
import { type ComponentType, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  InteractionManager,
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qrCodeScanImage } from '@/components/images';
import { useToast } from '@/components/toast/Toast';
import { type ActionEntryKey, RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';
import { ROUTES } from '@/constants/routes';
import { useSelectedProductionColor } from '@/hooks/receiving/useReceiving';
import { useReceivingHomeStatusBar } from '@/hooks/receiving/useReceivingHomeStatusBar';
import { getAndroidGestureBottomInset } from '@/navigation/androidNavigationBar';
import type { LogisticsScreenProps } from '@/navigation/types';
import {
  calcSelectedPanelLayout,
  getImageAspectRatio,
  PANEL_IMAGE_OVERLAP,
  type PanelLayoutMetrics,
  TAB_CLEARANCE_BUFFER,
  TAB_FLOAT_BOTTOM_GAP,
} from '@/sections/receiving/home/panelLayout';
import { ReceivingHomeEmptyState } from '@/sections/receiving/home/ReceivingHomeEmptyState';
import {
  ReceivingHomePopover,
  ReceivingHomeSearchBar,
  ReceivingHomeSearchHeader,
} from '@/sections/receiving/home/ReceivingHomeSearchHeader';
import { ReceivingHomeSlidingPanel } from '@/sections/receiving/home/ReceivingHomeSlidingPanel';
import { ReceivingActionEntries } from '@/sections/receiving/ReceivingActionEntries';
import { ReceivingImagePreview } from '@/sections/receiving/ReceivingImagePreview';
import { ReceivingScreenBackground } from '@/sections/receiving/ReceivingScreenBackground';
import { markNavStart, navPerf, navPerfHomeRender } from '@/utils/navPerf';
import { resolveReceivingImage } from '@/utils/receiving/images';

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
  navPerfHomeRender({
    isFocused: navigation.isFocused(),
  });

  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const tabBarHeightRaw = useBottomTabBarHeight();
  // TabBar 若被卸载，height 会掉成 0并触发整页重布局；锁定上次有效值避免堵死子页首屏。
  const lockedTabBarHeightRef = useRef(tabBarHeightRaw);
  if (tabBarHeightRaw > 0) {
    lockedTabBarHeightRef.current = tabBarHeightRaw;
  }
  const tabBarHeight = tabBarHeightRaw > 0 ? tabBarHeightRaw : lockedTabBarHeightRef.current;
  const window = useWindowDimensions();
  const bottomInset =
    Platform.OS === 'android' ? getAndroidGestureBottomInset(insets.bottom) : insets.bottom;

  const { data: selected, refresh } = useSelectedProductionColor();
  useReceivingHomeStatusBar(navigation, Boolean(selected));
  const [previewVisible, setPreviewVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(!homePopoverDismissedThisSession);
  const [contentHeight, setContentHeight] = useState(0);
  const [ChromePrewarm, setChromePrewarm] = useState<ComponentType | null>(null);

  const panelOffset = useRef(new Animated.Value(0)).current;
  const panelLayoutRef = useRef<PanelLayoutMetrics | null>(null);
  const dragStartOffset = useRef(0);
  const searchNavigatedRef = useRef(false);
  const scanNavigatedRef = useRef(false);

  const bottomReserve =
    tabBarHeight + Math.max(bottomInset, TAB_FLOAT_BOTTOM_GAP) + TAB_CLEARANCE_BUFFER;
  const usableContentHeight = Math.max(0, contentHeight - bottomReserve);

  const heroImage = selected ? resolveReceivingImage(selected.imageUrls[0]) : null;
  const imageAspect = useMemo(() => (heroImage ? getImageAspectRatio(heroImage) : 1), [heroImage]);
  const imageNaturalHeight = window.width / imageAspect;

  const panelLayout = useMemo(() => {
    if (!selected || usableContentHeight <= 0) return null;
    return calcSelectedPanelLayout(usableContentHeight, imageNaturalHeight);
  }, [selected, usableContentHeight, imageNaturalHeight]);

  useFocusEffect(
    useCallback(() => {
      searchNavigatedRef.current = false;
      scanNavigatedRef.current = false;
      void refresh();
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
    markNavStart('qrScan', 'press');
    if (onScanPress) {
      onScanPress();
      return;
    }
    navigation.navigate(ROUTES.LOGISTICS.QR_SCAN);
    navPerf('qrScan', 'navigate-returned');
  }, [navigation, onScanPress]);

  const goSearch = useCallback(() => {
    if (searchNavigatedRef.current) return;
    searchNavigatedRef.current = true;
    markNavStart('search', 'press');
    navigation.navigate(ROUTES.LOGISTICS.SEARCH);
    navPerf('search', 'navigate-returned');
  }, [navigation]);

  useEffect(() => {
    if (refreshToken) {
      void refresh();
    }
  }, [refresh, refreshToken]);

  useEffect(() => {
    if (!panelLayout) return;
    panelLayoutRef.current = panelLayout;
    panelOffset.setValue(panelLayout.defaultPanelTop);
  }, [panelLayout, panelOffset, selected?.id]);

  const animatePanelTo = useCallback(
    (toValue: number) => {
      Animated.spring(panelOffset, {
        toValue,
        useNativeDriver: false,
        damping: 22,
        stiffness: 220,
      }).start();
    },
    [panelOffset],
  );

  const panResponder = useMemo(() => {
    if (!panelLayout?.canSlide) {
      return null;
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        panelOffset.stopAnimation((value) => {
          dragStartOffset.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const layout = panelLayoutRef.current;
        if (!layout) return;
        const next = Math.min(
          Math.max(layout.minPanelTop, dragStartOffset.current + gesture.dy),
          layout.maxPanelTop,
        );
        panelOffset.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const layout = panelLayoutRef.current;
        if (!layout) return;

        panelOffset.stopAnimation((current) => {
          const mid = (layout.minPanelTop + layout.maxPanelTop) / 2;
          let target = current;
          if (gesture.vy < -0.25 || gesture.dy < -20) {
            target = layout.minPanelTop;
          } else if (gesture.vy > 0.25 || gesture.dy > 20) {
            target = layout.maxPanelTop;
          } else {
            target = current < mid ? layout.minPanelTop : layout.maxPanelTop;
          }
          animatePanelTo(target);
        });
      },
    });
  }, [animatePanelTo, panelLayout?.canSlide, panelOffset]);

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
    ? `${selected.productCode}/${selected.color}/${selected.brand}`
    : undefined;

  const searchBar = (
    <ReceivingHomeSearchBar
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
        onDisabledPress={() => showToast('请先扫描或搜索生产二维码', { duration: 3000 })}
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
        <View
          style={styles.contentArea}
          onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
        >
          {panelLayout && heroImage ? (
            <>
              <Animated.View style={[styles.heroWrap, { height: heroWrapHeight }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPreviewVisible(true)}
                  style={styles.heroPressable}
                >
                  <Image
                    resizeMode="cover"
                    source={heroImage}
                    style={[styles.heroImage, { height: imageNaturalHeight }]}
                  />
                  <View style={styles.heroOverlay}>
                    <Text style={styles.heroTitle}>
                      {selected.productCode} | {selected.color}
                    </Text>
                    <View style={styles.brandTag}>
                      <Text style={styles.brandTagText}>品牌 {selected.brand}</Text>
                    </View>
                  </View>
                  <Text style={styles.pageIndicator}>1/{selected.imageUrls.length}</Text>
                </Pressable>
              </Animated.View>

              <ReceivingHomeSlidingPanel
                top={panelOffset}
                bottomReserve={bottomReserve}
                {...(panResponder ? { panHandlers: panResponder.panHandlers } : {})}
              >
                <ReceivingActionEntries summary={selected} onPressEntry={navigateEntry} />
              </ReceivingHomeSlidingPanel>
            </>
          ) : null}
        </View>
        <ReceivingHomeSearchHeader absolute searchBar={searchBar} />
      </View>

      <ReceivingImagePreview
        visible={previewVisible}
        imageKeys={selected.imageUrls}
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
  heroPressable: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  heroImage: {
    width: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 12,
    bottom: PANEL_IMAGE_OVERLAP + 17,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  brandTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#105FC8',
  },
  brandTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pageIndicator: {
    position: 'absolute',
    right: 12,
    bottom: PANEL_IMAGE_OVERLAP + 17,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
