/**
 * 导航首屏性能打点（临时诊断用）。
 * Metro / Logcat 过滤关键字：NavPerf
 *
 * 用法：
 * 1. 点击入口时 markNavStart('search' | 'qrScan')
 * 2. 目标页各生命周期调用 navPerf(...)
 * 3. 把带 [NavPerf] 的日志整段贴回分析
 */

type NavTarget = 'search' | 'qrScan';

interface NavPerfSession {
  target: NavTarget;
  startMs: number;
  id: number;
}

let session: NavPerfSession | null = null;
let seq = 0;
let homeRenderCount = 0;

const now = () => Date.now();

export const markNavStart = (target: NavTarget, phase = 'press') => {
  seq += 1;
  homeRenderCount = 0;
  session = { target, startMs: now(), id: seq };

  console.log(
    `[NavPerf] #${session.id} START target=${target} phase=${phase} t=${session.startMs}`,
  );
  return session.id;
};

export const navPerf = (target: NavTarget, phase: string, extra?: Record<string, unknown>) => {
  const t = now();
  const active = session?.target === target ? session : null;
  const elapsed = active ? t - active.startMs : null;
  const id = active?.id ?? '-';
  const extraText = extra ? ` ${JSON.stringify(extra)}` : '';

  console.log(
    `[NavPerf] #${id} ${target} ${phase} t=${t}` +
      (elapsed != null ? ` +${elapsed}ms` : ' (no-start)') +
      extraText,
  );
};

/** 在 first-render 同步阶段调度，用于判断 8s 卡在「同步渲染」还是「commit 之后」 */
export const navPerfScheduleProbes = (target: NavTarget, fromPhase: string) => {
  queueMicrotask(() => {
    navPerf(target, `${fromPhase}->microtask`);
  });
  setTimeout(() => {
    navPerf(target, `${fromPhase}->timeout0`);
  }, 0);
  requestAnimationFrame(() => {
    navPerf(target, `${fromPhase}->raf`);
  });
};

/** 首页在导航会话期间的每次 render */
export const navPerfHomeRender = (extra?: Record<string, unknown>) => {
  if (!session) return;
  homeRenderCount += 1;
  if (homeRenderCount > 20) return;
  navPerf(session.target, `home-render#${homeRenderCount}`, extra);
};

export const navPerfModuleLoad = (moduleName: string) => {
  console.log(`[NavPerf] MODULE_LOAD ${moduleName} t=${now()}`);
};
