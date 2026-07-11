import { Pressable, Text } from 'design-system-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CloseIcon from '@/assets/icons/close.svg';
import { AppModal } from '@/components/AppModal';

interface ReceivingBottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  maxHeightRatio?: number;
}

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
    <AppModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      bare
      backdropStyle={styles.backdrop}
    >
      <View style={[styles.sheet, { maxHeight, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose} style={styles.close}>
            <CloseIcon width={16} height={16} color="#061B37" />
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8DFEA',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#021626',
  },
  close: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingBottom: 8,
  },
  footer: {
    paddingTop: 12,
  },
});
