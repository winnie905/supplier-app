import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import MarkEmailReadIcon from '@/assets/icons/markEmailRead.svg';
import { ROUTES } from '@/constants/routes';
import { useFactoryExceptions } from '@/hooks/receiving/useReceiving';
import type { ExceptionModule } from '@/types/receiving';
import { formatPendingExceptionCornerTag } from '@/utils/receiving/exceptions';

interface NavLike {
  setOptions: (options: { headerRight?: () => React.ReactNode }) => void;
  navigate: (name: string, params: Record<string, unknown>) => void;
}

interface UseExceptionReportChromeParams {
  navigation: NavLike;
  productionColorId: string;
  module: ExceptionModule;
  allowedTypes: readonly string[];
}

/** 异常回复 header + 上报 sheet 状态（物料/裁床共用） */
export const useExceptionReportChrome = ({
  navigation,
  productionColorId,
  module,
  allowedTypes,
}: UseExceptionReportChromeParams) => {
  const {
    items: exceptions,
    pendingCount,
    refresh: refreshExceptions,
  } = useFactoryExceptions(productionColorId, module);
  const [exceptionVisible, setExceptionVisible] = useState(false);
  const [exceptionTypes, setExceptionTypes] = useState<string[]>([]);
  const [exceptionDesc, setExceptionDesc] = useState('');

  const cornerTag = useMemo(
    () => formatPendingExceptionCornerTag(exceptions, allowedTypes),
    [allowedTypes, exceptions],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate(ROUTES.LOGISTICS.EXCEPTION_REPLY_LIST, {
              productionColorId,
              module,
            })
          }
          style={styles.headerRight}
        >
          <MarkEmailReadIcon color="#105FC8" height={16} width={16} />
          <Text style={styles.headerRightText}>异常回复</Text>
          {pendingCount > 0 ? <View style={styles.badgeDot} /> : null}
        </Pressable>
      ),
    });
  }, [module, navigation, pendingCount, productionColorId]);

  const openExceptionSheet = useCallback(() => setExceptionVisible(true), []);

  const closeExceptionSheet = useCallback(() => {
    setExceptionVisible(false);
  }, []);

  const resetExceptionForm = useCallback(() => {
    setExceptionDesc('');
    setExceptionTypes([]);
  }, []);

  return {
    cornerTag,
    pendingCount,
    exceptionVisible,
    exceptionTypes,
    setExceptionTypes,
    exceptionDesc,
    setExceptionDesc,
    openExceptionSheet,
    closeExceptionSheet,
    resetExceptionForm,
    refreshExceptions,
  };
};

export const ExceptionReportButton = ({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[styles.exceptionBtn, style]}>
    <Text style={styles.exceptionBtnText}>异常上报</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 16,
    position: 'relative',
  },
  headerRightText: {
    color: '#105FC8',
    fontSize: 15,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
  },
  exceptionBtn: {
    minWidth: 100,
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#105FC8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exceptionBtnText: {
    color: '#105FC8',
    fontSize: 18,
  },
});
