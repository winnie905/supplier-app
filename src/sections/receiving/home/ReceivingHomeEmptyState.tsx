import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { managementEmptyImage } from '@/components/images';
import { RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';
import { ReceivingActionEntries } from '@/sections/receiving/ReceivingActionEntries';
import { ReceivingScreenBackground } from '@/sections/receiving/ReceivingScreenBackground';

import { FOUR_ENTRIES_PANEL_HEIGHT, TOP_ZONE_HEIGHT } from './panelLayout';
import { PanelHandle } from './ReceivingHomeSlidingPanel';

export const ReceivingHomeEmptyState = ({
  bottomReserve,
  searchHeader,
  onDisabledPress,
}: {
  bottomReserve: number;
  searchHeader: ReactNode;
  onDisabledPress: () => void;
}) => (
  <View style={styles.root}>
    <ReceivingScreenBackground />
    <View pointerEvents="none" style={[styles.bottomFill, { height: bottomReserve }]} />
    <View style={styles.pageContent}>
      <View style={[styles.topZone, { height: TOP_ZONE_HEIGHT }]}>
        {searchHeader}
        <View style={styles.placeholderArea}>
          <Image
            resizeMode="contain"
            source={managementEmptyImage}
            style={styles.placeholderImage}
          />
        </View>
      </View>
      <View style={[styles.emptyPanel, { paddingBottom: bottomReserve }]}>
        <PanelHandle />
        <ReceivingActionEntries
          disabled
          onDisabledPress={onDisabledPress}
          onPressEntry={() => undefined}
        />
      </View>
    </View>
  </View>
);

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
  pageContent: {
    flex: 1,
  },
  topZone: {
    // 允许搜索提示 popover 浮在空态图上方（不裁切）
    overflow: 'visible',
    zIndex: 2,
  },
  placeholderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  placeholderImage: {
    width: 170,
    height: 170,
  },
  emptyPanel: {
    flex: 1,
    minHeight: FOUR_ENTRIES_PANEL_HEIGHT,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 4,
    opacity: 0.9,
  },
});
