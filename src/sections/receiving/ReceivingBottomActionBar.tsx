import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlatButton } from '@/components/FlatButton';

interface ReceivingBottomActionBarProps {
  left?: ReactNode;
  center?: ReactNode;
  rightLabel: string;
  onRightPress: () => void;
  rightDisabled?: boolean;
}

export const ReceivingBottomActionBar = ({
  left,
  center,
  rightLabel,
  onRightPress,
  rightDisabled,
}: ReceivingBottomActionBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {left}
      {center}
      <FlatButton
        disabled={rightDisabled}
        onPress={onRightPress}
        style={styles.submitBtn}
        textStyle={styles.submitBtnText}
      >
        {rightLabel}
      </FlatButton>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5EBF3',
  },
  submitBtn: {
    flex: 1,
    minWidth: 120,
    height: 45,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 18,
  },
});
