import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { loadingGifImage } from '@/components/images';
import { WORKBENCH_REFRESH_ICON_SIZE } from '@/constants/workbenchRefresh';

export type WorkbenchRefreshHint = 'pull' | 'release' | 'refreshing';

interface WorkbenchRefreshIndicatorProps {
  hint: WorkbenchRefreshHint;
}

const resolvedLoadingGifSource = Image.resolveAssetSource(loadingGifImage);

export const WorkbenchRefreshIndicator = ({ hint }: WorkbenchRefreshIndicatorProps) => {
  const gifSource = useMemo(
    () => (resolvedLoadingGifSource?.uri ? { uri: resolvedLoadingGifSource.uri } : loadingGifImage),
    [],
  );

  const hintTextMap: Record<WorkbenchRefreshHint, string> = {
    pull: '下拉刷新',
    release: '松开刷新',
    refreshing: '正在刷新...',
  };

  return (
    <View style={styles.content}>
      <Image
        key="workbench-refresh-gif"
        fadeDuration={0}
        resizeMode="contain"
        source={gifSource}
        style={styles.icon}
      />

      <Text style={styles.text}>{hintTextMap[hint]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  icon: {
    width: WORKBENCH_REFRESH_ICON_SIZE,
    height: WORKBENCH_REFRESH_ICON_SIZE,
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
    color: '#587192',
    lineHeight: 12,
  },
});
