import { useCallback, useEffect, useMemo, useState } from 'react';
import { type FlatListProps, StyleSheet, View } from 'react-native';
import { FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

interface PullToRefreshFlatListProps<ItemT> extends Omit<FlatListProps<ItemT>, 'onRefresh'> {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
}

export function PullToRefreshFlatList<ItemT>({
  isRefreshing,
  onRefresh,
  ListHeaderComponent,
  ...rest
}: PullToRefreshFlatListProps<ItemT>) {
  const scrollOffset = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const panBase = useSharedValue(0);
  const isRefreshingShared = useSharedValue(false);
  const [hint, setHint] = useState<WorkbenchRefreshHint | null>(null);

  const updatePullState = useCallback((distance: number, refreshing: boolean) => {
    if (refreshing) {
      setHint('refreshing');
      return;
    }

    if (distance >= WORKBENCH_REFRESH_TRIGGER_DISTANCE) {
      setHint('release');
      return;
    }

    if (distance > 0) {
      setHint('pull');
      return;
    }

    setHint(null);
  }, []);

  const triggerRefresh = useCallback(() => {
    void onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingShared.value = isRefreshing;

    if (isRefreshing) {
      pullDistance.value = WORKBENCH_REFRESH_TRIGGER_DISTANCE;
      setHint('refreshing');
      return;
    }

    pullDistance.value = withTiming(0, { duration: 200 });
    setHint(null);
  }, [isRefreshing, isRefreshingShared, pullDistance]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(8)
        .failOffsetX([-12, 12])
        .onBegin(() => {
          panBase.value = pullDistance.value;
        })
        .onUpdate((event) => {
          if (isRefreshingShared.value || scrollOffset.value > 0) {
            return;
          }

          const nextDistance = Math.min(
            Math.max(panBase.value + event.translationY, 0),
            WORKBENCH_REFRESH_MAX_PULL,
          );
          pullDistance.value = nextDistance;
          runOnJS(updatePullState)(nextDistance, false);
        })
        .onEnd(() => {
          if (isRefreshingShared.value) {
            return;
          }

          if (pullDistance.value >= WORKBENCH_REFRESH_TRIGGER_DISTANCE) {
            isRefreshingShared.value = true;
            pullDistance.value = WORKBENCH_REFRESH_TRIGGER_DISTANCE;
            runOnJS(setHint)('refreshing');
            runOnJS(triggerRefresh)();
            return;
          }

          pullDistance.value = withTiming(0, { duration: 200 });
          runOnJS(setHint)(null);
        }),
    [isRefreshingShared, panBase, pullDistance, scrollOffset, triggerRefresh, updatePullState],
  );

  const nativeGesture = useMemo(() => Gesture.Native(), []);
  const composedGesture = useMemo(
    () => Gesture.Simultaneous(nativeGesture, panGesture),
    [nativeGesture, panGesture],
  );

  const refreshOverlayStyle = useAnimatedStyle(() => ({
    height: isRefreshingShared.value ? WORKBENCH_REFRESH_TRIGGER_DISTANCE : pullDistance.value,
  }));

  const listTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isRefreshingShared.value
          ? WORKBENCH_REFRESH_TRIGGER_DISTANCE
          : pullDistance.value,
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

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.listWrap, listTranslateStyle]}>
          <AnimatedFlatList
            {...rest}
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            ListHeaderComponent={ListHeaderComponent}
          />
        </Animated.View>
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
  listWrap: {
    flex: 1,
  },
});
