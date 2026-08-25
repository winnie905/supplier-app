/** 前台 session 轮询间隔（毫秒）。兼顾移动端性能与接口压力。 */
export const SESSION_CHECK_INTERVAL_MS = 60_000;

/** 后端 401 message 中包含该片段时，视为账号在其他设备登录。 */
export const SESSION_KICKED_OFFLINE_MESSAGE_MARKER = '其他设备登录';

/** 被挤下线时登录页弹窗兜底文案。 */
export const DEFAULT_SESSION_KICKED_OFFLINE_MESSAGE =
  '当前账号已在另一台移动设备上登录，\n本机将被登出';
