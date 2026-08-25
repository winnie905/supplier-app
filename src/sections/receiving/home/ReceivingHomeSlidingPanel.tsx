import { designTokens } from 'design-system-native';
import type { ReactNode } from 'react';
import { Animated, type GestureResponderHandlers, StyleSheet, View } from 'react-native';

import { RECEIVING_ACTION_PANEL_BG } from '@/constants/receiving';

export const PanelHandle = ({ panHandlers }: { panHandlers?: GestureResponderHandlers }) => (
  <View {...(panHandlers ?? {})} style={styles.panelHandleWrap}>
    <View style={styles.panelHandle} />
  </View>
);

export const ReceivingHomeSlidingPanel = ({
  top,
  bottomReserve,
  panHandlers,
  children,
}: {
  top: Animated.Value;
  bottomReserve: number;
  panHandlers?: GestureResponderHandlers;
  children: ReactNode;
}) => (
  <Animated.View
    {...(panHandlers ?? {})}
    style={[
      styles.panel,
      {
        top,
        bottom: 0,
      },
    ]}
  >
    <View style={[styles.panelInner, { paddingBottom: bottomReserve }]}>
      <PanelHandle />
      {children}
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: RECEIVING_ACTION_PANEL_BG,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: designTokens.colors.gray[0],
    overflow: 'hidden',
  },
  panelInner: {
    flex: 1,
  },
  panelHandleWrap: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  panelHandle: {
    width: 75,
    height: 5,
    borderRadius: 135,
    backgroundColor: '#C0C7CD',
  },
});
