import { useFocusEffect } from '@react-navigation/native';
import { designTokens } from 'design-system-native';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '@/assets/icons/back.svg';
import { searchEmpty } from '@/components/images';
import { SearchCapsuleBar } from '@/components/SearchCapsuleBar';
import { getSafeAreaTopInset } from '@/utils/app';

/** Android stateHidden 下程序化 focus 需短延迟重试 */
const FOCUS_RETRY_DELAYS_MS = [60, 180, 360];

interface SearchScreenShellProps<T> {
  keyword: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  onSearch: () => void;
  onBack: () => void;
  loading: boolean;
  searched: boolean;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number, isLast: boolean) => ReactElement;
  /**
   * Receiving：首帧只画白底，下一帧再挂搜索框并以 autoFocus 挂载，
   * 再短延迟 focus() 兜底，保证打开页自动聚焦并调起键盘。
   */
  deferredFocus?: boolean;
  /** Receiving：白底页同步深色 StatusBar */
  syncStatusBar?: boolean;
  /** 是否允许触发搜索（deferredFocus 时需等输入框就绪） */
  onReadyChange?: (ready: boolean) => void;
}

export const SearchScreenShell = <T,>({
  keyword,
  onChangeText,
  onClear,
  onSearch,
  onBack,
  loading,
  searched,
  data,
  keyExtractor,
  renderItem,
  deferredFocus = false,
  syncStatusBar = false,
  onReadyChange,
}: SearchScreenShellProps<T>) => {
  const insets = useSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets.top);
  const inputRef = useRef<TextInput>(null);
  const [inputReady, setInputReady] = useState(!deferredFocus);

  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!syncStatusBar) return;
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(designTokens.colors.gray[0]);
      }
    }, [syncStatusBar]),
  );

  useEffect(() => {
    if (!deferredFocus) {
      setInputReady(true);
      onReadyChange?.(true);
      return;
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setInputReady(true);
        onReadyChange?.(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [deferredFocus, onReadyChange]);

  useEffect(() => {
    if (!deferredFocus || !inputReady) return;
    const timers = FOCUS_RETRY_DELAYS_MS.map((delay) =>
      setTimeout(() => {
        inputRef.current?.focus();
      }, delay),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [deferredFocus, inputReady]);

  const body = (
    <>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.backBtn}
        >
          <BackIcon color="#061B37" height={22} width={22} />
        </Pressable>

        <SearchCapsuleBar
          ref={inputRef}
          autoFocus
          value={keyword}
          onChangeText={onChangeText}
          onClear={onClear}
          onSearch={onSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={designTokens.colors.brand[500]} style={styles.loader} />
      ) : searched && data.length === 0 ? (
        <View style={styles.empty}>
          <Image resizeMode="contain" source={searchEmpty} style={styles.emptyImage} />
          <Text style={styles.emptyTitle}>抱歉，没有找到相关数据~</Text>
          <Text style={styles.emptyHint}>换个词试试</Text>
        </View>
      ) : searched ? (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={dismissKeyboard}
          renderItem={({ item, index }) => renderItem(item, index, index === data.length - 1)}
        />
      ) : (
        <View style={styles.flexFill} />
      )}
    </>
  );

  return (
    <Pressable accessible={false} onPress={dismissKeyboard} style={styles.root}>
      {deferredFocus ? (inputReady ? body : null) : body}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: designTokens.colors.gray[0],
  },
  flexFill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: designTokens.colors.gray[0],
  },
  backBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 260,
    height: 200,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: designTokens.colors.gray[500],
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: designTokens.colors.gray[500],
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
});
