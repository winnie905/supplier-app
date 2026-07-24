import { Pressable, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import CloseIcon from '@/assets/icons/close.svg';
import SearchNoticeIcon from '@/assets/icons/searchNotice.svg';
import { SafeAreaHeader } from '@/components/SafeAreaHeader';
import { SearchEntryBar } from '@/components/SearchEntryBar';

/** @deprecated 请优先使用 SearchEntryBar；保留别名以兼容收发首页 */
export const ReceivingHomeSearchBar = SearchEntryBar;

export const ReceivingHomePopover = ({ onClose }: { onClose: () => void }) => (
  <View style={popoverStyles.wrap}>
    <View style={popoverStyles.content}>
      <View style={popoverStyles.arrow} />
      <View style={popoverStyles.card}>
        <SearchNoticeIcon height={14} style={popoverStyles.leadingIcon} width={14} />
        <Text style={popoverStyles.text}>
          扫描 D&J生产二维码或搜索大货款号{'\n'}开始收发管理操作
        </Text>
        <Pressable
          accessibilityLabel="关闭提示"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={popoverStyles.closeBtn}
        >
          <CloseIcon color="#FFFFFF" height={14} width={14} />
        </Pressable>
      </View>
    </View>
  </View>
);

const SEARCH_BAR_HEIGHT = 40;

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
    <View style={styles.searchBlock}>
      {searchBar}
      {popover ? (
        <View pointerEvents="box-none" style={styles.popoverAnchor}>
          {popover}
        </View>
      ) : null}
    </View>
  </SafeAreaHeader>
);

const popoverStyles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    // 相对搜索框：左再缩 20、右再缩 22（搜索框左右各 16）
    marginLeft: 36,
    marginRight: 38,
    zIndex: 1000,
  },
  content: {
    alignSelf: 'stretch',
  },
  arrow: {
    position: 'absolute',
    top: -4,
    left: 16,
    width: 14,
    height: 14,
    backgroundColor: '#3A4350',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#3A4350',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  // 与首行文字顶对齐（lineHeight 20 - icon 14）/ 2
  leadingIcon: {
    marginTop: 3,
  },
  closeBtn: {
    marginTop: 3,
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
  searchBlock: {
    zIndex: 2,
  },
  /** 贴在搜索框下方，不占文档流 */
  popoverAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SEARCH_BAR_HEIGHT,
    zIndex: 1000,
  },
});
