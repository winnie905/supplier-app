import DeviceInfo from 'react-native-device-info';

import { env } from '@/config/env';

export const APP_NAME = 'supplier-app';
export const APP_DOWNLOAD_PAGE_URL = env.APP_DOWNLOAD_PAGE_URL;
export const APP_VERSION = process.env.APP_VERSION ?? DeviceInfo.getVersion() ?? '1.0.0';
export const HTTP_TIMEOUT_MS = 10_000;
export const SETTINGS_LIST_ITEM_HEIGHT = 48;
/** 原始地图目录名称 */
export const ORIGINAL_MAP_CATALOG_NAME = 'original-assets';
/** 压缩地图目录名称 */
export const COMPRESS_DIRECTORY_NAME = 'user-assets';
