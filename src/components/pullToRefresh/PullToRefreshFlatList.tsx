import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  type FlatListProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { PullToRefreshContainer } from './PullToRefreshContainer';

interface PullToRefreshFlatListProps<ItemT> extends Omit<FlatListProps<ItemT>, 'onRefresh'> {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
}

/**
 * 列表 + 顶部「下拉刷新 / 正在刷新...」指示（与收发首页 PullToRefreshContainer 同款）。
 * 仅在滚到顶部时启用下拉手势，避免与列表滑动冲突。
 */
export function PullToRefreshFlatList<ItemT>({
  isRefreshing,
  onRefresh,
  onScroll,
  style,
  ...rest
}: PullToRefreshFlatListProps<ItemT>) {
  const [atTop, setAtTop] = useState(true);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      setAtTop(y <= 0.5);
      onScroll?.(event);
    },
    [onScroll],
  );

  const refreshEnabled = useMemo(() => atTop || isRefreshing, [atTop, isRefreshing]);

  return (
    <PullToRefreshContainer
      enabled={refreshEnabled}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.root}>
        <FlatList
          {...rest}
          style={[styles.list, style]}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          onScroll={handleScroll}
        />
      </View>
    </PullToRefreshContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
});
