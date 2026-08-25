import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerModal } from '@/components/SelectionModal';

interface ReceivingBottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  maxHeightRatio?: number;
}

/** 收发场景底部抽屉：基于 DrawerModal，保留原标题样式 */
export const ReceivingBottomSheet = ({
  visible,
  title,
  onClose,
  footer,
  maxHeightRatio = 0.85,
  children,
}: ReceivingBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const maxHeight = window.height * maxHeightRatio - insets.top;

  return (
    <DrawerModal
      visible={visible}
      title={title}
      onClose={onClose}
      footer={footer}
      // 高度跟随内容，超过上限后再滚动
      height="auto"
      sheetStyle={[styles.sheet, { maxHeight }]}
      headerStyle={styles.header}
      titleStyle={styles.title}
      contentContainerStyle={styles.bodyContent}
    >
      {children}
    </DrawerModal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    paddingTop: 0,
  },
  header: {
    height: undefined,
    marginBottom: 0,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  bodyContent: {
    gap: 0,
    flexGrow: 0,
  },
});
