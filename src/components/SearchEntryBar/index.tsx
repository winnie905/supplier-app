import { Pressable, Text } from 'design-system-native';
import { type StyleProp, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import ScanIcon from '@/assets/icons/scan.svg';

/** 中性搜索入口条（收发首页 / Apps 生产单列表共用） */
export const SearchEntryBar = ({
  onScanPress,
  onSearchPress,
  onSearchPressIn,
  value,
  showScan = true,
  style,
}: {
  onScanPress?: () => void;
  onSearchPress: () => void;
  onSearchPressIn?: (() => void) | undefined;
  value?: string;
  /** 收发首页默认 true；应用首页无扫码时传 false */
  showScan?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.capsule, style]}>
    {showScan ? (
      <>
        <Pressable
          accessibilityLabel="扫码"
          accessibilityRole="button"
          hitSlop={4}
          onPress={onScanPress}
          onPressIn={onScanPress}
          style={styles.scanBtn}
        >
          <ScanIcon color="#061B37" height={18} width={18} />
        </Pressable>
        <View style={styles.divider} />
      </>
    ) : null}
    <Pressable
      accessibilityRole="button"
      onPress={onSearchPress}
      {...(onSearchPressIn ? { onPressIn: onSearchPressIn } : {})}
      style={styles.inputPressable}
    >
      <TextInput
        editable={false}
        pointerEvents="none"
        placeholder="搜索大货款号/客户PO/品牌"
        placeholderTextColor="#A8BBD4"
        style={[
          styles.input,
          !showScan ? styles.inputNoScan : null,
          value ? styles.inputFilled : null,
        ]}
        value={value ?? ''}
      />
    </Pressable>
    <Pressable
      accessibilityRole="button"
      onPress={onSearchPress}
      {...(onSearchPressIn ? { onPressIn: onSearchPressIn } : {})}
      style={styles.searchBtn}
    >
      <Text style={styles.searchBtnText}>搜索</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginHorizontal: 16,
    backgroundColor: 'rgba(247, 249, 252, 0.8)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scanBtn: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#A7AFC1',
  },
  inputPressable: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 15,
    color: '#BDC8D8',
  },
  inputNoScan: {
    paddingLeft: 14,
  },
  inputFilled: {
    color: '#061B37',
    fontWeight: '500',
  },
  searchBtn: {
    height: 30,
    paddingHorizontal: 8,
    backgroundColor: '#105FC8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 5,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
