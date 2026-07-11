import { Image, type ImageSourcePropType } from 'react-native';

import { REMOTE_RECEIVING_IMAGE_ASPECT } from '@/utils/receiving/images';

/** 含状态栏 + 搜索区，至 action 面板顶部的默认高度 */
export const TOP_ZONE_HEIGHT = 320;
const ENTRY_ITEM_HEIGHT = 88;
const ENTRY_GAP = 8;
const PANEL_HANDLE_HEIGHT = 25;
const PANEL_BOTTOM_PADDING = 16;
/** 面板上圆角叠压在图片上的高度，与 panel borderTopRadius 一致 */
export const PANEL_IMAGE_OVERLAP = 18;
/** 悬浮 Tab 距屏幕底部的最小间距（与 AppTabBar 一致） */
export const TAB_FLOAT_BOTTOM_GAP = 16;
export const TAB_CLEARANCE_BUFFER = 8;

export const TWO_ENTRIES_PANEL_HEIGHT =
  PANEL_HANDLE_HEIGHT + 2 * ENTRY_ITEM_HEIGHT + ENTRY_GAP + PANEL_BOTTOM_PADDING;
export const FOUR_ENTRIES_PANEL_HEIGHT =
  PANEL_HANDLE_HEIGHT + 4 * ENTRY_ITEM_HEIGHT + 3 * ENTRY_GAP + PANEL_BOTTOM_PADDING;

export const getImageAspectRatio = (source: ImageSourcePropType): number => {
  if (typeof source === 'object' && source !== null && 'uri' in source && source.uri) {
    return REMOTE_RECEIVING_IMAGE_ASPECT;
  }
  const resolved = Image.resolveAssetSource(source);
  if (resolved?.width && resolved?.height) {
    return resolved.width / resolved.height;
  }
  return 3 / 4;
};

export interface PanelLayoutMetrics {
  defaultPanelTop: number;
  minPanelTop: number;
  maxPanelTop: number;
  canSlide: boolean;
}

/**
 * @param usableContentHeight 内容区可用高度（已扣除底部 Tab / 手势区）
 * @param imageNaturalHeight 样品图按屏宽 contain 时的自然高度
 *
 * 小图：完整展示图片 + 4 个入口，面板填满剩余高度，不可滑动
 * 大图：默认展示 4 个完整入口；下滑最低保留 2 个完整入口，二者均不遮挡 Tab
 */
export const calcSelectedPanelLayout = (
  usableContentHeight: number,
  imageNaturalHeight: number,
): PanelLayoutMetrics => {
  const panelTopForFourEntries = usableContentHeight - FOUR_ENTRIES_PANEL_HEIGHT;
  const panelTopForTwoEntries = usableContentHeight - TWO_ENTRIES_PANEL_HEIGHT;

  if (imageNaturalHeight + FOUR_ENTRIES_PANEL_HEIGHT <= usableContentHeight) {
    const panelTop = Math.max(0, imageNaturalHeight - PANEL_IMAGE_OVERLAP);
    return {
      defaultPanelTop: panelTop,
      minPanelTop: panelTop,
      maxPanelTop: panelTop,
      canSlide: false,
    };
  }

  return {
    defaultPanelTop: panelTopForFourEntries,
    minPanelTop: panelTopForFourEntries,
    maxPanelTop: panelTopForTwoEntries,
    canSlide: panelTopForFourEntries < panelTopForTwoEntries - 1,
  };
};
