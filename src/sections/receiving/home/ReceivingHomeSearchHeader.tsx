import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import CloseIcon from '@/assets/icons/close.svg';
import NoticeIcon from '@/assets/icons/notice.svg';
import ScanIcon from '@/assets/icons/scan.svg';
import { SafeAreaHeader } from '@/components/SafeAreaHeader';

export const ReceivingHomeSearchBar = ({
  onScanPress,
  onSearchPress,
  onSearchPressIn,
  value,
}: {
  onScanPress: () => void;
  onSearchPress: () => void;
  onSearchPressIn?: (() => void) | undefined;
  value?: string;
}) => (
  <View style={searchStyles.capsule}>
    <Pressable
      accessibilityLabel="扫码"
      accessibilityRole="button"
      hitSlop={4}
      onPress={onScanPress}
      onPressIn={onScanPress}
      style={searchStyles.scanBtn}
    >
      <ScanIcon color="#061B37" height={18} width={18} />
    </Pressable>
    <View style={searchStyles.divider} />
    <Pressable
      accessibilityRole="button"
      onPress={onSearchPress}
      {...(onSearchPressIn ? { onPressIn: onSearchPressIn } : {})}
      style={searchStyles.inputPressable}
    >
      <TextInput
        editable={false}
        pointerEvents="none"
        placeholder="搜索大货款号/客户PO/品牌"
        placeholderTextColor="#A8BBD4"
        style={[searchStyles.input, value ? searchStyles.inputFilled : null]}
        value={value ?? ''}
      />
    </Pressable>
    <Pressable
      accessibilityRole="button"
      onPress={onSearchPress}
      {...(onSearchPressIn ? { onPressIn: onSearchPressIn } : {})}
      style={searchStyles.searchBtn}
    >
      <Text style={searchStyles.searchBtnText}>搜索</Text>
    </Pressable>
  </View>
);

export const ReceivingHomePopover = ({ onClose }: { onClose: () => void }) => (
  <View style={popoverStyles.wrap}>
    <View style={popoverStyles.arrow} />
    <View style={popoverStyles.card}>
      <NoticeIcon color="#105FC8" height={18} width={18} />
      <Text style={popoverStyles.text}>扫描 D&J生产二维码或搜索大货款号{'\n'}开始收发管理操作</Text>
      <Pressable
        accessibilityLabel="关闭提示"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClose}
      >
        <CloseIcon color="#FFFFFF" height={14} width={14} />
      </Pressable>
    </View>
  </View>
);

export const ReceivingHomeSearchHeader = ({
  absolute,
  searchBar,
  popover,
}: {
  absolute?: boolean;
  searchBar: ReactNode;
  popover?: ReactNode;
}) => (
  <SafeAreaHeader
    {...(absolute ? { absolute: true } : {})}
    compensateTopBleed
    contentSpacing={8}
    paddingHorizontal={0}
    style={absolute ? styles.searchOverlay : styles.searchSection}
  >
    {searchBar}
    {popover}
  </SafeAreaHeader>
);

const searchStyles = StyleSheet.create({
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

const popoverStyles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginHorizontal: 16,
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  arrow: {
    marginLeft: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3A4350',
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#3A4350',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
  searchSection: {
    zIndex: 2,
  },
  searchOverlay: {
    zIndex: 2,
    pointerEvents: 'box-none',
  },
});
