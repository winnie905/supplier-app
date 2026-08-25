import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

import {
  calcSelectedPanelLayout,
  type PanelLayoutMetrics,
} from '@/sections/receiving/home/panelLayout';

interface UseReceivingHomePanelParams {
  selectedId?: string;
  usableContentHeight: number;
  imageNaturalHeight: number;
}

/** 选中态底部滑动面板：布局计算 + PanResponder + spring 归位 */
export const useReceivingHomePanel = ({
  selectedId,
  usableContentHeight,
  imageNaturalHeight,
}: UseReceivingHomePanelParams) => {
  const panelOffset = useRef(new Animated.Value(0)).current;
  const panelLayoutRef = useRef<PanelLayoutMetrics | null>(null);
  const dragStartOffset = useRef(0);

  const panelLayout = useMemo(() => {
    if (!selectedId || usableContentHeight <= 0) return null;
    return calcSelectedPanelLayout(usableContentHeight, imageNaturalHeight);
  }, [selectedId, usableContentHeight, imageNaturalHeight]);

  useEffect(() => {
    if (!panelLayout) return;
    panelLayoutRef.current = panelLayout;
    panelOffset.setValue(panelLayout.defaultPanelTop);
  }, [panelLayout, panelOffset, selectedId]);

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

    const isVerticalDrag = (_: unknown, gesture: { dx: number; dy: number }) =>
      Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) > Math.abs(gesture.dx);

    return PanResponder.create({
      // 点击仍交给入口 Pressable；明显纵向滑动时整块入口区接管
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: isVerticalDrag,
      onMoveShouldSetPanResponderCapture: isVerticalDrag,
      onPanResponderTerminationRequest: () => false,
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
          if (gesture.vy < -0.15 || gesture.dy < -12) {
            target = layout.minPanelTop;
          } else if (gesture.vy > 0.15 || gesture.dy > 12) {
            target = layout.maxPanelTop;
          } else {
            target = current < mid ? layout.minPanelTop : layout.maxPanelTop;
          }
          animatePanelTo(target);
        });
      },
    });
  }, [animatePanelTo, panelLayout?.canSlide, panelOffset]);

  return { panelOffset, panelLayout, panResponder };
};
