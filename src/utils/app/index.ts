/** app 子模块 barrel：仅做重导出，不放置具体实现。 */
export {
  buildFileUrl,
  buildUserAgent,
  getBleedCompensatedTopPadding,
  getRuntimeConfigStorage,
  getSafeAreaTopInset,
  logger,
  saveRuntimeConfigStorage,
  STACK_HEADER_TOOLBAR_HEIGHT,
} from './common';
export {
  compareVersion,
  exitAppSafely,
  getDismissedOptionalUpdateVersion,
  isVersionLowerThan,
  openUpdateTarget,
  setDismissedOptionalUpdateVersion,
} from './version';
