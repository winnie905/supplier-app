/** 一次扫码事件处理后，冷却多久再解锁，避免相机连续回调重复触发 */
export const SCAN_STABILIZE_MS = 1000;

/** 单码稳定窗口：同一个二维码内容需连续稳定出现至少这么久才允许触发单码业务 */
export const SCAN_SINGLE_CONFIRM_MS = 400;

/** 多码保护期：识别到多码后，必须连续这么久都只识别到一个码，才退出保护期。 */
export const SCAN_MULTI_PROTECTION_MS = 600;

/** 单码稳定期内允许的漏检容差（毫秒） */
export const SCAN_SINGLE_GAP_TOLERANCE_MS = 250;

// ---------------------------------------------------------------------------
// 自动变焦（分级、平滑放大）
// ---------------------------------------------------------------------------

/**
 * 自动变焦分级倍率（相对自动变焦开始前的基准倍率）。
 * 不一次跳到最大倍率，逐级放大并在每级之间等待相机重新对焦/识别。
 */
export const QR_AUTO_ZOOM_STEP_FACTORS = [1.0, 1.3, 1.7, 2.2, 3.0] as const;

/** 自动变焦软上限：正常情况下逐级放大到此倍率（相对 neutralZoom）。 */
export const QR_AUTO_ZOOM_SOFT_CAP = 3;

/** 自动变焦硬上限：自动变焦绝对不会超过此倍率（相对 neutralZoom）。 */
export const QR_AUTO_ZOOM_HARD_CAP = 4;

/** 每次自动放大后，等待画面稳定并重新识别的时间（毫秒），避免每帧连续改 zoom。 */
export const QR_AUTO_ZOOM_STEP_DWELL_MS = 700;

/** 进入解码间隙后，等待此时间再开始分级放大（毫秒），避免一闪一闪地放大。 */
export const QR_AUTO_ZOOM_IDLE_BEFORE_MS = 500;

/** 距上次解码到二维码不超过此时间则视为“当前画面有码”（毫秒）。 */
export const QR_AUTO_ZOOM_CODE_PRESENT_MS = 300;

/**
 * 曾扫到码后又持续无解码超过此时间，则判定码已离开，回退到放大前倍率（毫秒）。
 * 从未扫到码的情况不回退，放大到软上限后保持。
 */
export const QR_AUTO_ZOOM_LOST_RESET_MS = 1500;

/** 自动变焦轮询间隔（毫秒）。 */
export const QR_AUTO_ZOOM_TICK_MS = 200;

/** 单级自动变焦动画时长（毫秒），用 withTiming 平滑过渡。 */
export const QR_AUTO_ZOOM_TRANSITION_MS = 320;

/** 手势缩放结束后，禁止自动变焦的冷却时间（毫秒）。 */
export const QR_GESTURE_ZOOM_COOLDOWN_MS = 3000;
