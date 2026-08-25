import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  WORKBENCH_REFRESH_MAX_PULL,
  WORKBENCH_REFRESH_TRIGGER_DISTANCE,
  WORKBENCH_REFRESH_VERTICAL_PADDING,
} from '@/constants/workbenchRefresh';

import type { WorkbenchRefreshHint } from './WorkbenchRefreshIndicator';
import { WorkbenchRefreshIndicator } from './WorkbenchRefreshIndicator';

interface PullToRefreshContainerProps {
  children: ReactNode;
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  /** 为 false 时关闭下拉手势（如空态） */
  enabled?: boolean;
  /** 容器顶边贴屏幕顶部时传入安全区高度，避免指示器压在状态栏 / 刘海下 */
  topInset?: number;
}

/** 非列表页下拉刷新容器（顶部展示下拉刷新 / 松开刷新 / 正在刷新...） */
export function PullToRefreshContainer({
  children,
  isRefreshing,
  onRefresh,
  enabled = true,
  topInset = 0,
}: PullToRefreshContainerProps) {
  /** 指示器停靠位置需整体下移一个安全区，因此触发距离同步加大 */
  const triggerDistance = WORKBENCH_REFRESH_TRIGGER_DISTANCE + topInset;
  const maxPull = WORKBENCH_REFRESH_MAX_PULL + topInset;
  const pullDistance = useSharedValue(0);
  const panBase = useSharedValue(0);
  const isRefreshingShared = useSharedValue(false);
  const [hint, setHint] = useState<WorkbenchRefreshHint | null>(null);

  const updatePullState = useCallback(
    (distance: number, refreshing: boolean) => {
      if (refreshing) {
        setHint('refreshing');
        return;
      }
      if (distance >= triggerDistance) {
        setHint('release');
        return;
      }
      if (distance > 0) {
        setHint('pull');
        return;
      }
      setHint(null);
    },
    [triggerDistance],
  );

  const triggerRefresh = useCallback(() => {
    void onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingShared.value = isRefreshing;
    if (isRefreshing) {
      pullDistance.value = triggerDistance;
      setHint('refreshing');
      return;
    }
    pullDistance.value = withTiming(0, { duration: 200 });
    setHint(null);
  }, [isRefreshing, isRefreshingShared, pullDistance, triggerDistance]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY(8)
        .failOffsetX([-12, 12])
        .onBegin(() => {
          panBase.value = pullDistance.value;
        })
        .onUpdate((event) => {
          if (isRefreshingShared.value || event.translationY < 0) {
            return;
          }
          const nextDistance = Math.min(Math.max(panBase.value + event.translationY, 0), maxPull);
          pullDistance.value = nextDistance;
          runOnJS(updatePullState)(nextDistance, false);
        })
        .onEnd(() => {
          if (isRefreshingShared.value) {
            return;
          }
          if (pullDistance.value >= triggerDistance) {
            isRefreshingShared.value = true;
            pullDistance.value = triggerDistance;
            runOnJS(setHint)('refreshing');
            runOnJS(triggerRefresh)();
            return;
          }
          pullDistance.value = withTiming(0, { duration: 200 });
          runOnJS(setHint)(null);
        }),
    [
      enabled,
      isRefreshingShared,
      maxPull,
      panBase,
      pullDistance,
      triggerDistance,
      triggerRefresh,
      updatePullState,
    ],
  );

  const refreshOverlayStyle = useAnimatedStyle(() => ({
    height: isRefreshingShared.value ? triggerDistance : pullDistance.value,
  }));

  const contentTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isRefreshingShared.value ? triggerDistance : pullDistance.value,
      },
    ],
  }));

  return (
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[styles.refreshOverlay, refreshOverlayStyle]}>
        <View style={styles.refreshInner}>
          {hint ? <WorkbenchRefreshIndicator hint={hint} /> : null}
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, contentTranslateStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  refreshInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: WORKBENCH_REFRESH_TRIGGER_DISTANCE,
    paddingTop: WORKBENCH_REFRESH_VERTICAL_PADDING,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  content: {
    flex: 1,
  },
});
