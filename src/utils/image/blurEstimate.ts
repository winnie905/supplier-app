/**
 * 存放基于像素分析的本地图像质量检测：模糊、清晰度、
 * 运动拖影等无需服务端参与的预判算法。
 */
import { toByteArray } from 'base64-js';
import { decode } from 'jpeg-js';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const RESIZE_MAX = 512;
const RESIZE_QUALITY = 92;
const BLOCK_GRID = 4;

const LOW_EDGE_MIN_THRESHOLD = 8;
const HIGH_EDGE_MIN_THRESHOLD = 24;

/**
 * 这里只作为日志输出，不再作为主判据。
 */
const DEBUG_THRESHOLD = 0.46;
const DEBUG_RATIO_THRESHOLD = 0.16;

const CENTER_ROI_X_RATIO = 0.15;
const CENTER_ROI_Y_RATIO = 0.15;
const CENTER_ROI_W_RATIO = 0.7;
const CENTER_ROI_H_RATIO = 0.7;

const SCORE_BLEND_CENTER_WEIGHT = 0.35;
const SCORE_BLEND_FULL_WEIGHT = 0.65;
const FEATURE_BLEND_CENTER_WEIGHT = 0.4;
const FEATURE_BLEND_FULL_WEIGHT = 0.6;

const LAPLACIAN_KERNEL = [0, -1, 0, -1, 4, -1, 0, -1, 0] as const;

export interface BlurEstimateResult {
  isBlur: boolean;
  variance: number;
  success: boolean;
  reason:
    | 'decode_failed'
    | 'empty_image'
    | 'read_failed'
    | 'resize_failed'
    | 'low_texture'
    | undefined;
  debug?: {
    centerScore: number;
    fullScore: number;
    usableBlockCount: number;
    centerUsableBlockCount: number;
    fullUsableBlockCount: number;
    motionBlurBlockRatio: number;
    centerMotionBlurBlockRatio: number;
    fullMotionBlurBlockRatio: number;
    directionalBlurBlockRatio: number;
    centerDirectionalBlurBlockRatio: number;
    fullDirectionalBlurBlockRatio: number;
    collapseBlurBlockRatio: number;
    centerCollapseBlurBlockRatio: number;
    fullCollapseBlurBlockRatio: number;
    crispEdgeRatio: number;
    centerCrispEdgeRatio: number;
    fullCrispEdgeRatio: number;
    dominantDirectionRatio: number;
    centerDominantDirectionRatio: number;
    fullDominantDirectionRatio: number;
    threshold: number;
    ratioThreshold: number;
  };
}

interface GradientStats {
  tenengradMean: number;
  edgeDensity: number;
  crispEdgeRatio: number;
  dominantDirectionRatio: number;
}

interface RegionMetrics {
  lapVariance: number;
  grayStd: number;
  edgeDensity: number;
  tenengradMean: number;
  crispEdgeRatio: number;
  dominantDirectionRatio: number;
  edgeSteepness: number;
  score: number;
}

type MotionBlurKind = 'none' | 'directional' | 'collapse';

interface RegionScoreResult {
  score: number;
  usableBlockCount: number;
  motionBlurBlockRatio: number;
  directionalBlurBlockRatio: number;
  collapseBlurBlockRatio: number;
  avgCrispEdgeRatio: number;
  avgDominantDirectionRatio: number;
  avgEdgeSteepness: number;
}

interface FinalRegionSelection {
  score: number;
  usableBlockCount: number;
  motionBlurBlockRatio: number;
  directionalBlurBlockRatio: number;
  collapseBlurBlockRatio: number;
  crispEdgeRatio: number;
  dominantDirectionRatio: number;
  edgeSteepness: number;
}

interface BlurAnalysis {
  centerScore: number;
  fullScore: number;
  isBlur: boolean;
  score: number;
  usableBlockCount: number;
  centerUsableBlockCount: number;
  fullUsableBlockCount: number;
  motionBlurBlockRatio: number;
  centerMotionBlurBlockRatio: number;
  fullMotionBlurBlockRatio: number;
  directionalBlurBlockRatio: number;
  centerDirectionalBlurBlockRatio: number;
  fullDirectionalBlurBlockRatio: number;
  collapseBlurBlockRatio: number;
  centerCollapseBlurBlockRatio: number;
  fullCollapseBlurBlockRatio: number;
  crispEdgeRatio: number;
  centerCrispEdgeRatio: number;
  fullCrispEdgeRatio: number;
  dominantDirectionRatio: number;
  centerDominantDirectionRatio: number;
  fullDominantDirectionRatio: number;
  threshold: number;
  ratioThreshold: number;
}

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(v, max));

const normalizeFilePath = (uri: string): string => {
  if (uri.startsWith('file://')) {
    return uri.replace(/^file:\/\//, '');
  }

  return uri;
};

const buildFailureResult = (reason: BlurEstimateResult['reason']): BlurEstimateResult => ({
  isBlur: false,
  variance: 0,
  success: false,
  reason,
});

const createEmptyRegionScoreResult = (): RegionScoreResult => ({
  score: 0,
  usableBlockCount: 0,
  motionBlurBlockRatio: 0,
  directionalBlurBlockRatio: 0,
  collapseBlurBlockRatio: 0,
  avgCrispEdgeRatio: 0,
  avgDominantDirectionRatio: 1,
  avgEdgeSteepness: 999,
});

const createEmptyBlurAnalysis = (): BlurAnalysis => ({
  centerScore: 0,
  fullScore: 0,
  isBlur: false,
  score: 0,
  usableBlockCount: 0,
  centerUsableBlockCount: 0,
  fullUsableBlockCount: 0,
  motionBlurBlockRatio: 0,
  centerMotionBlurBlockRatio: 0,
  fullMotionBlurBlockRatio: 0,
  directionalBlurBlockRatio: 0,
  centerDirectionalBlurBlockRatio: 0,
  fullDirectionalBlurBlockRatio: 0,
  collapseBlurBlockRatio: 0,
  centerCollapseBlurBlockRatio: 0,
  fullCollapseBlurBlockRatio: 0,
  crispEdgeRatio: 0,
  centerCrispEdgeRatio: 0,
  fullCrispEdgeRatio: 0,
  dominantDirectionRatio: 1,
  centerDominantDirectionRatio: 1,
  fullDominantDirectionRatio: 1,
  threshold: DEBUG_THRESHOLD,
  ratioThreshold: DEBUG_RATIO_THRESHOLD,
});

const toFinalRegionSelection = (result: RegionScoreResult): FinalRegionSelection => ({
  score: result.score,
  usableBlockCount: result.usableBlockCount,
  motionBlurBlockRatio: result.motionBlurBlockRatio,
  directionalBlurBlockRatio: result.directionalBlurBlockRatio,
  collapseBlurBlockRatio: result.collapseBlurBlockRatio,
  crispEdgeRatio: result.avgCrispEdgeRatio,
  dominantDirectionRatio: result.avgDominantDirectionRatio,
  edgeSteepness: result.avgEdgeSteepness,
});

const blendFinalRegionSelection = (
  center: RegionScoreResult,
  full: RegionScoreResult,
): FinalRegionSelection => ({
  score: center.score * SCORE_BLEND_CENTER_WEIGHT + full.score * SCORE_BLEND_FULL_WEIGHT,
  usableBlockCount: Math.max(center.usableBlockCount, full.usableBlockCount),
  motionBlurBlockRatio:
    center.motionBlurBlockRatio * SCORE_BLEND_CENTER_WEIGHT +
    full.motionBlurBlockRatio * SCORE_BLEND_FULL_WEIGHT,
  directionalBlurBlockRatio:
    center.directionalBlurBlockRatio * SCORE_BLEND_CENTER_WEIGHT +
    full.directionalBlurBlockRatio * SCORE_BLEND_FULL_WEIGHT,
  collapseBlurBlockRatio:
    center.collapseBlurBlockRatio * SCORE_BLEND_CENTER_WEIGHT +
    full.collapseBlurBlockRatio * SCORE_BLEND_FULL_WEIGHT,
  crispEdgeRatio:
    center.avgCrispEdgeRatio * FEATURE_BLEND_CENTER_WEIGHT +
    full.avgCrispEdgeRatio * FEATURE_BLEND_FULL_WEIGHT,
  dominantDirectionRatio:
    center.avgDominantDirectionRatio * FEATURE_BLEND_CENTER_WEIGHT +
    full.avgDominantDirectionRatio * FEATURE_BLEND_FULL_WEIGHT,
  edgeSteepness:
    center.avgEdgeSteepness * FEATURE_BLEND_CENTER_WEIGHT +
    full.avgEdgeSteepness * FEATURE_BLEND_FULL_WEIGHT,
});

const selectFinalRegionMetrics = (
  centerResult: RegionScoreResult,
  fullResult: RegionScoreResult,
): FinalRegionSelection | null => {
  if (centerResult.usableBlockCount >= 4 && fullResult.usableBlockCount > 0) {
    return blendFinalRegionSelection(centerResult, fullResult);
  }

  if (centerResult.usableBlockCount > 0) {
    return toFinalRegionSelection(centerResult);
  }

  if (fullResult.usableBlockCount > 0) {
    return toFinalRegionSelection(fullResult);
  }

  return null;
};

const buildBlurDebug = (analysis: BlurAnalysis): NonNullable<BlurEstimateResult['debug']> => ({
  centerScore: analysis.centerScore,
  fullScore: analysis.fullScore,
  usableBlockCount: analysis.usableBlockCount,
  centerUsableBlockCount: analysis.centerUsableBlockCount,
  fullUsableBlockCount: analysis.fullUsableBlockCount,
  motionBlurBlockRatio: analysis.motionBlurBlockRatio,
  centerMotionBlurBlockRatio: analysis.centerMotionBlurBlockRatio,
  fullMotionBlurBlockRatio: analysis.fullMotionBlurBlockRatio,
  directionalBlurBlockRatio: analysis.directionalBlurBlockRatio,
  centerDirectionalBlurBlockRatio: analysis.centerDirectionalBlurBlockRatio,
  fullDirectionalBlurBlockRatio: analysis.fullDirectionalBlurBlockRatio,
  collapseBlurBlockRatio: analysis.collapseBlurBlockRatio,
  centerCollapseBlurBlockRatio: analysis.centerCollapseBlurBlockRatio,
  fullCollapseBlurBlockRatio: analysis.fullCollapseBlurBlockRatio,
  crispEdgeRatio: analysis.crispEdgeRatio,
  centerCrispEdgeRatio: analysis.centerCrispEdgeRatio,
  fullCrispEdgeRatio: analysis.fullCrispEdgeRatio,
  dominantDirectionRatio: analysis.dominantDirectionRatio,
  centerDominantDirectionRatio: analysis.centerDominantDirectionRatio,
  fullDominantDirectionRatio: analysis.fullDominantDirectionRatio,
  threshold: analysis.threshold,
  ratioThreshold: analysis.ratioThreshold,
});

const logBlurAnalysis = (analysis: BlurAnalysis): void => {
  console.log('[estimateImageBlurFast]', {
    centerScore: analysis.centerScore,
    centerMotionBlurBlockRatio: analysis.centerMotionBlurBlockRatio,
    centerDirectionalBlurBlockRatio: analysis.centerDirectionalBlurBlockRatio,
    centerCollapseBlurBlockRatio: analysis.centerCollapseBlurBlockRatio,
    centerUsableBlockCount: analysis.centerUsableBlockCount,
    centerCrispEdgeRatio: analysis.centerCrispEdgeRatio,
    centerDominantDirectionRatio: analysis.centerDominantDirectionRatio,
    finalScore: analysis.score,
    fullScore: analysis.fullScore,
    fullMotionBlurBlockRatio: analysis.fullMotionBlurBlockRatio,
    fullDirectionalBlurBlockRatio: analysis.fullDirectionalBlurBlockRatio,
    fullCollapseBlurBlockRatio: analysis.fullCollapseBlurBlockRatio,
    fullUsableBlockCount: analysis.fullUsableBlockCount,
    fullCrispEdgeRatio: analysis.fullCrispEdgeRatio,
    fullDominantDirectionRatio: analysis.fullDominantDirectionRatio,
    isBlur: analysis.isBlur,
    ratioThreshold: analysis.ratioThreshold,
    motionBlurBlockRatio: analysis.motionBlurBlockRatio,
    directionalBlurBlockRatio: analysis.directionalBlurBlockRatio,
    collapseBlurBlockRatio: analysis.collapseBlurBlockRatio,
    crispEdgeRatio: analysis.crispEdgeRatio,
    dominantDirectionRatio: analysis.dominantDirectionRatio,
    threshold: analysis.threshold,
    usableBlockCount: analysis.usableBlockCount,
  });
};

const cleanupTempFile = async (uri: string | null): Promise<void> => {
  if (!uri) {
    return;
  }

  const resizedPath = normalizeFilePath(uri);

  try {
    const exists = await RNFS.exists(resizedPath);
    if (exists) {
      await RNFS.unlink(resizedPath);
    }
  } catch {
    // 清理失败不影响主流程
  }
};

const rgbToGray = (data: Uint8Array, width: number, height: number): Uint8Array => {
  const pixelCount = width * height;
  const gray = new Uint8Array(pixelCount);

  for (let i = 0; i < pixelCount; i += 1) {
    const base = i * 4;
    const r = data[base] ?? 0;
    const g = data[base + 1] ?? 0;
    const b = data[base + 2] ?? 0;

    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return gray;
};

const markGrayRegion = (
  gray: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): { data: Uint8Array; width: number; height: number } => {
  const sx = clamp(Math.floor(x), 0, Math.max(0, width - 1));
  const sy = clamp(Math.floor(y), 0, Math.max(0, height - 1));
  const ex = clamp(Math.floor(x + w), sx + 1, width);
  const ey = clamp(Math.floor(y + h), sy + 1, height);

  const rw = ex - sx;
  const rh = ey - sy;
  const out = new Uint8Array(rw * rh);

  for (let row = 0; row < rh; row += 1) {
    const srcStart = (sy + row) * width + sx;
    const srcEnd = srcStart + rw;
    out.set(gray.subarray(srcStart, srcEnd), row * rw);
  }

  return { data: out, width: rw, height: rh };
};

const grayStdDev = (gray: Uint8Array): number => {
  if (!gray.length) {
    return 0;
  }

  let sum = 0;
  let sumSq = 0;

  for (const v of gray) {
    sum += v;
    sumSq += v * v;
  }

  const mean = sum / gray.length;
  const variance = sumSq / gray.length - mean * mean;

  return Math.sqrt(Math.max(variance, 0));
};

const laplacianVariance = (gray: Uint8Array, width: number, height: number): number => {
  if (width < 3 || height < 3) {
    return 0;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let acc = 0;
      let k = 0;

      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          acc += (gray[(y + ky) * width + (x + kx)] ?? 0) * (LAPLACIAN_KERNEL[k] ?? 0);
          k += 1;
        }
      }

      sum += acc;
      sumSq += acc * acc;
      count += 1;
    }
  }

  if (count === 0) {
    return 0;
  }

  const mean = sum / count;
  return Math.max(0, sumSq / count - mean * mean);
};

const getGradientStats = (
  gray: Uint8Array,
  width: number,
  height: number,
  grayStd: number,
): GradientStats => {
  if (width < 3 || height < 3) {
    return {
      tenengradMean: 0,
      edgeDensity: 0,
      crispEdgeRatio: 0,
      dominantDirectionRatio: 0,
    };
  }

  const lowThreshold = Math.max(LOW_EDGE_MIN_THRESHOLD, grayStd * 0.42);
  const highThreshold = Math.max(HIGH_EDGE_MIN_THRESHOLD, grayStd * 1.45);
  const lapGateBase = Math.max(8, grayStd * 0.32);

  let gradSum = 0;
  let lowEdgeCount = 0;
  let crispEdgeCount = 0;
  let total = 0;

  let sumAbsGx = 0;
  let sumAbsGy = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const tl = gray[(y - 1) * width + (x - 1)] ?? 0;
      const tc = gray[(y - 1) * width + x] ?? 0;
      const tr = gray[(y - 1) * width + (x + 1)] ?? 0;
      const ml = gray[y * width + (x - 1)] ?? 0;
      const mc = gray[y * width + x] ?? 0;
      const mr = gray[y * width + (x + 1)] ?? 0;
      const bl = gray[(y + 1) * width + (x - 1)] ?? 0;
      const bc = gray[(y + 1) * width + x] ?? 0;
      const br = gray[(y + 1) * width + (x + 1)] ?? 0;

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = tl + 2 * tc + tr - bl - 2 * bc - br;
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const lapAbs = Math.abs(tc + bc + ml + mr - 4 * mc);

      gradSum += magnitude;
      sumAbsGx += Math.abs(gx);
      sumAbsGy += Math.abs(gy);

      if (magnitude >= lowThreshold) {
        lowEdgeCount += 1;
      }

      /**
       * crisp 只作为“拖影反证”。
       */
      if (magnitude >= highThreshold && lapAbs >= Math.max(lapGateBase, magnitude * 0.2)) {
        crispEdgeCount += 1;
      }

      total += 1;
    }
  }

  if (!total) {
    return {
      tenengradMean: 0,
      edgeDensity: 0,
      crispEdgeRatio: 0,
      dominantDirectionRatio: 0,
    };
  }

  const dominantDirectionRatio = Math.max(sumAbsGx, sumAbsGy) / (Math.min(sumAbsGx, sumAbsGy) + 1);

  return {
    tenengradMean: gradSum / total,
    edgeDensity: lowEdgeCount / total,
    crispEdgeRatio: crispEdgeCount / Math.max(lowEdgeCount, 1),
    dominantDirectionRatio,
  };
};

const quantile = (values: number[], q: number): number => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * clamp(q, 0, 1);
  const base = Math.floor(pos);
  const rest = pos - base;

  if (base >= sorted.length - 1) {
    return sorted[sorted.length - 1] ?? 0;
  }

  const left = sorted[base] ?? 0;
  const right = sorted[base + 1] ?? 0;

  return left + (right - left) * rest;
};

const buildMotionBlurDiagnosticScore = (metrics: RegionMetrics): number => {
  const directionPart = clamp((metrics.dominantDirectionRatio - 1.6) / 0.85, 0, 1);
  const softnessPart = clamp(1 - metrics.edgeSteepness / 1.2, 0, 1);
  const crispLossPart = clamp((0.26 - metrics.crispEdgeRatio) / 0.26, 0, 1);
  const edgeSupportPart = clamp((metrics.edgeDensity - 0.025) / 0.12, 0, 1);

  let directionalScore =
    directionPart * 0.52 + softnessPart * 0.28 + crispLossPart * 0.15 + edgeSupportPart * 0.05;

  if (metrics.crispEdgeRatio > 0.3 && metrics.edgeSteepness > 0.78) {
    directionalScore *= 0.4;
  } else if (metrics.crispEdgeRatio > 0.26 && metrics.edgeSteepness > 0.72) {
    directionalScore *= 0.58;
  }

  const collapseCrispPart = clamp((0.08 - metrics.crispEdgeRatio) / 0.08, 0, 1);
  const collapseSoftnessPart = clamp(1 - metrics.edgeSteepness / 1.18, 0, 1);
  const collapseSupportPart = clamp((metrics.edgeDensity - 0.03) / 0.1, 0, 1);

  let collapseScore =
    collapseCrispPart * 0.62 + collapseSoftnessPart * 0.28 + collapseSupportPart * 0.1;

  if (
    metrics.crispEdgeRatio <= 0.03 &&
    metrics.edgeSteepness <= 1.05 &&
    metrics.edgeDensity >= 0.035
  ) {
    collapseScore += 0.08;
  }

  return clamp(Math.max(directionalScore, collapseScore), 0, 1);
};

const analyzeRegionMetrics = (gray: Uint8Array, width: number, height: number): RegionMetrics => {
  const grayStd = grayStdDev(gray);
  const lapVariance = laplacianVariance(gray, width, height);
  const gradientStats = getGradientStats(gray, width, height, grayStd);
  const edgeSteepness = lapVariance / (gradientStats.tenengradMean + 1);

  const tempMetrics: Omit<RegionMetrics, 'score'> = {
    lapVariance,
    grayStd,
    edgeDensity: gradientStats.edgeDensity,
    tenengradMean: gradientStats.tenengradMean,
    crispEdgeRatio: gradientStats.crispEdgeRatio,
    dominantDirectionRatio: gradientStats.dominantDirectionRatio,
    edgeSteepness,
  };

  const score = buildMotionBlurDiagnosticScore({ ...tempMetrics, score: 0 });

  return {
    ...tempMetrics,
    score,
  };
};

const classifyMotionBlurBlock = (metrics: RegionMetrics): MotionBlurKind => {
  /**
   * 原来是 0.028。
   * 这里提高到 0.035，减少低纹理/弱边缘区域被当成有效模糊块。
   */
  if (metrics.edgeDensity < 0.035) {
    return 'none';
  }

  /**
   * 方向拖影型：
   * 收紧判定条件，避免清晰图片里局部纹理方向性较强时被误判。
   *
   * 调整点：
   * - dominantDirectionRatio 要求更高；
   * - crispEdgeRatio 要求更低；
   * - edgeSteepness 要求更低，必须真的发软才算拖影。
   */
  if (
    (metrics.dominantDirectionRatio >= 2.15 &&
      metrics.crispEdgeRatio <= 0.24 &&
      metrics.edgeSteepness <= 1.18) ||
    (metrics.dominantDirectionRatio >= 2.35 &&
      metrics.crispEdgeRatio <= 0.28 &&
      metrics.edgeSteepness <= 1.3) ||
    (metrics.dominantDirectionRatio >= 2.55 && metrics.crispEdgeRatio <= 0.2)
  ) {
    return 'directional';
  }

  /**
   * 整体塌陷型：
   * 收紧 crisp 和 edgeSteepness。
   * 清晰图即使纹理少，也不应该轻易被归为整体发虚。
   */
  if (
    (metrics.crispEdgeRatio <= 0.04 &&
      metrics.edgeSteepness <= 1.05 &&
      metrics.edgeDensity >= 0.045) ||
    (metrics.crispEdgeRatio <= 0.025 &&
      metrics.edgeSteepness <= 1.18 &&
      metrics.edgeDensity >= 0.04)
  ) {
    return 'collapse';
  }

  return 'none';
};

const isUsableBlock = (metrics: RegionMetrics): boolean => {
  return (
    metrics.edgeDensity >= 0.02 ||
    (metrics.grayStd >= 8 && metrics.edgeDensity >= 0.012) ||
    (metrics.tenengradMean >= 9 && metrics.edgeDensity >= 0.015)
  );
};

const scoreRegionByBlocks = (
  gray: Uint8Array,
  width: number,
  height: number,
  blockGrid = BLOCK_GRID,
): RegionScoreResult => {
  if (width < 24 || height < 24) {
    const metrics = analyzeRegionMetrics(gray, width, height);
    const usable = isUsableBlock(metrics);
    const blurKind = usable ? classifyMotionBlurBlock(metrics) : 'none';

    return {
      score: metrics.score,
      usableBlockCount: usable ? 1 : 0,
      motionBlurBlockRatio: usable && blurKind !== 'none' ? 1 : 0,
      directionalBlurBlockRatio: usable && blurKind === 'directional' ? 1 : 0,
      collapseBlurBlockRatio: usable && blurKind === 'collapse' ? 1 : 0,
      avgCrispEdgeRatio: usable ? metrics.crispEdgeRatio : 0,
      avgDominantDirectionRatio: usable ? metrics.dominantDirectionRatio : 1,
      avgEdgeSteepness: usable ? metrics.edgeSteepness : 999,
    };
  }

  const blockScores: number[] = [];

  let motionBlurBlockCount = 0;
  let directionalBlurBlockCount = 0;
  let collapseBlurBlockCount = 0;

  let crispRatioSum = 0;
  let dominantRatioSum = 0;
  let edgeSteepnessSum = 0;

  const blockW = Math.floor(width / blockGrid);
  const blockH = Math.floor(height / blockGrid);

  for (let by = 0; by < blockGrid; by += 1) {
    for (let bx = 0; bx < blockGrid; bx += 1) {
      const x = bx * blockW;
      const y = by * blockH;
      const w = bx === blockGrid - 1 ? width - x : blockW;
      const h = by === blockGrid - 1 ? height - y : blockH;

      if (w < 8 || h < 8) {
        continue;
      }

      const region = markGrayRegion(gray, width, height, x, y, w, h);
      const metrics = analyzeRegionMetrics(region.data, region.width, region.height);

      if (!isUsableBlock(metrics)) {
        continue;
      }

      const blurKind = classifyMotionBlurBlock(metrics);

      blockScores.push(metrics.score);
      crispRatioSum += metrics.crispEdgeRatio;
      dominantRatioSum += metrics.dominantDirectionRatio;
      edgeSteepnessSum += metrics.edgeSteepness;

      if (blurKind !== 'none') {
        motionBlurBlockCount += 1;
      }
      if (blurKind === 'directional') {
        directionalBlurBlockCount += 1;
      }
      if (blurKind === 'collapse') {
        collapseBlurBlockCount += 1;
      }
    }
  }

  if (!blockScores.length) {
    return createEmptyRegionScoreResult();
  }

  const usableBlockCount = blockScores.length;
  const highQuantile = quantile(blockScores, 0.75);
  const medianScore = quantile(blockScores, 0.5);

  return {
    score: highQuantile * 0.65 + medianScore * 0.35,
    usableBlockCount,
    motionBlurBlockRatio: motionBlurBlockCount / usableBlockCount,
    directionalBlurBlockRatio: directionalBlurBlockCount / usableBlockCount,
    collapseBlurBlockRatio: collapseBlurBlockCount / usableBlockCount,
    avgCrispEdgeRatio: crispRatioSum / usableBlockCount,
    avgDominantDirectionRatio: dominantRatioSum / usableBlockCount,
    avgEdgeSteepness: edgeSteepnessSum / usableBlockCount,
  };
};

const decideIsBlur = (
  finalMetrics: FinalRegionSelection,
  centerResult: RegionScoreResult,
  fullResult: RegionScoreResult,
): boolean => {
  /**
   * 保护规则：
   * 如果 crispEdgeRatio 明显不低，说明图里还有足够尖锐边缘。
   * 这种情况下不要轻易判模糊。
   *
   * 这条主要用于减少“清晰图被误杀”。
   */
  const hasEnoughCrispEdges =
    finalMetrics.crispEdgeRatio >= 0.28 || fullResult.avgCrispEdgeRatio >= 0.3;

  if (hasEnoughCrispEdges && finalMetrics.motionBlurBlockRatio < 0.28) {
    return false;
  }

  /**
   * 1. 方向拖影型：
   * 原来 fullResult.directionalBlurBlockRatio >= 0.08 太敏感。
   * 这里提高到 0.14。
   */
  const directionalTriggered =
    (fullResult.directionalBlurBlockRatio >= 0.14 &&
      fullResult.avgDominantDirectionRatio >= 1.95 &&
      fullResult.avgCrispEdgeRatio <= 0.2 &&
      fullResult.score >= 0.34) ||
    (finalMetrics.directionalBlurBlockRatio >= 0.14 &&
      finalMetrics.dominantDirectionRatio >= 1.9 &&
      finalMetrics.crispEdgeRatio <= 0.21 &&
      finalMetrics.score >= 0.28);

  /**
   * 2. 中度方向拖影兜底：
   * 原来比较容易触发。
   * 这里要求 score 更高、方向性更强、crisp 更低。
   */
  const directionalScoreTriggered =
    (centerResult.score >= 0.56 &&
      centerResult.avgDominantDirectionRatio >= 2.25 &&
      centerResult.avgCrispEdgeRatio <= 0.24) ||
    (fullResult.score >= 0.52 &&
      fullResult.avgDominantDirectionRatio >= 2.2 &&
      fullResult.avgCrispEdgeRatio <= 0.18);

  /**
   * 3. 整体塌陷型：
   * 原来 collapseBlurBlockRatio >= 0.12 偏敏感。
   * 提高 blockRatio，并要求 crisp 更低。
   */
  const collapseTriggered =
    (finalMetrics.collapseBlurBlockRatio >= 0.22 && finalMetrics.crispEdgeRatio <= 0.045) ||
    (fullResult.collapseBlurBlockRatio >= 0.22 && fullResult.avgCrispEdgeRatio <= 0.04);

  /**
   * 4. 低方向性但整体发虚型：
   * 这是最容易误杀清晰图的一类。
   * 原来 motionBlurBlockRatio >= 0.1、score >= 0.24 就可能触发，太宽了。
   *
   * 这里大幅收紧：
   * - blockRatio 至少 0.22；
   * - crispEdgeRatio 必须非常低；
   * - score 必须更高。
   */
  const lowDirectionHeavyBlurTriggered =
    (fullResult.score >= 0.42 &&
      fullResult.motionBlurBlockRatio >= 0.22 &&
      fullResult.avgDominantDirectionRatio <= 1.55 &&
      fullResult.avgCrispEdgeRatio <= 0.12) ||
    (finalMetrics.score >= 0.36 &&
      finalMetrics.motionBlurBlockRatio >= 0.22 &&
      finalMetrics.dominantDirectionRatio <= 1.5 &&
      finalMetrics.crispEdgeRatio <= 0.13);

  /**
   * 5. 极重度整体发虚：
   * 保留，但也稍微收紧 crisp。
   */
  const severeGlobalTriggered =
    finalMetrics.motionBlurBlockRatio >= 0.5 && finalMetrics.crispEdgeRatio <= 0.06;

  /**
   * 6. 高方向性中度模糊：
   * 收紧 score 和方向性。
   */
  const highDirectionMediumBlurTriggered =
    (fullResult.score >= 0.5 &&
      fullResult.avgDominantDirectionRatio >= 2.35 &&
      fullResult.avgCrispEdgeRatio <= 0.19) ||
    (finalMetrics.score >= 0.42 &&
      finalMetrics.dominantDirectionRatio >= 2.3 &&
      finalMetrics.crispEdgeRatio <= 0.22);

  /**
   * 7. 中等方向拖影：
   * 原规则偏敏感，容易把有方向纹理的清晰图误判。
   * 这里先保留，但收紧 ratio / score / crisp。
   */
  const mediumDirectionalTriggered =
    (fullResult.directionalBlurBlockRatio >= 0.24 &&
      fullResult.avgDominantDirectionRatio >= 1.7 &&
      fullResult.avgDominantDirectionRatio <= 1.95 &&
      fullResult.avgCrispEdgeRatio <= 0.16 &&
      fullResult.score >= 0.3) ||
    (finalMetrics.directionalBlurBlockRatio >= 0.22 &&
      finalMetrics.dominantDirectionRatio >= 1.68 &&
      finalMetrics.dominantDirectionRatio <= 1.9 &&
      finalMetrics.crispEdgeRatio <= 0.18 &&
      finalMetrics.score >= 0.26);

  return (
    directionalTriggered ||
    directionalScoreTriggered ||
    mediumDirectionalTriggered ||
    collapseTriggered ||
    lowDirectionHeavyBlurTriggered ||
    severeGlobalTriggered ||
    highDirectionMediumBlurTriggered
  );
};

const analyzeBlurFromGray = (gray: Uint8Array, width: number, height: number): BlurAnalysis => {
  const center = markGrayRegion(
    gray,
    width,
    height,
    width * CENTER_ROI_X_RATIO,
    height * CENTER_ROI_Y_RATIO,
    width * CENTER_ROI_W_RATIO,
    height * CENTER_ROI_H_RATIO,
  );

  const centerResult = scoreRegionByBlocks(center.data, center.width, center.height);
  const fullResult = scoreRegionByBlocks(gray, width, height);

  const finalMetrics = selectFinalRegionMetrics(centerResult, fullResult);

  if (!finalMetrics) {
    return createEmptyBlurAnalysis();
  }

  return {
    centerScore: centerResult.score,
    fullScore: fullResult.score,
    isBlur: decideIsBlur(finalMetrics, centerResult, fullResult),
    score: finalMetrics.score,
    usableBlockCount: finalMetrics.usableBlockCount,
    centerUsableBlockCount: centerResult.usableBlockCount,
    fullUsableBlockCount: fullResult.usableBlockCount,
    motionBlurBlockRatio: finalMetrics.motionBlurBlockRatio,
    centerMotionBlurBlockRatio: centerResult.motionBlurBlockRatio,
    fullMotionBlurBlockRatio: fullResult.motionBlurBlockRatio,
    directionalBlurBlockRatio: finalMetrics.directionalBlurBlockRatio,
    centerDirectionalBlurBlockRatio: centerResult.directionalBlurBlockRatio,
    fullDirectionalBlurBlockRatio: fullResult.directionalBlurBlockRatio,
    collapseBlurBlockRatio: finalMetrics.collapseBlurBlockRatio,
    centerCollapseBlurBlockRatio: centerResult.collapseBlurBlockRatio,
    fullCollapseBlurBlockRatio: fullResult.collapseBlurBlockRatio,
    crispEdgeRatio: finalMetrics.crispEdgeRatio,
    centerCrispEdgeRatio: centerResult.avgCrispEdgeRatio,
    fullCrispEdgeRatio: fullResult.avgCrispEdgeRatio,
    dominantDirectionRatio: finalMetrics.dominantDirectionRatio,
    centerDominantDirectionRatio: centerResult.avgDominantDirectionRatio,
    fullDominantDirectionRatio: fullResult.avgDominantDirectionRatio,
    threshold: DEBUG_THRESHOLD,
    ratioThreshold: DEBUG_RATIO_THRESHOLD,
  };
};

const resizeImageForBlurCheck = async (uri: string): Promise<string> => {
  const resized = await ImageResizer.createResizedImage(
    uri,
    RESIZE_MAX,
    RESIZE_MAX,
    'JPEG',
    RESIZE_QUALITY,
    0,
    undefined,
    false,
    {
      mode: 'contain',
      onlyScaleDown: true,
    },
  );

  return resized.uri;
};

export const estimateImageBlurFast = async (uri: string): Promise<BlurEstimateResult> => {
  let resizedUri: string | null = null;

  try {
    try {
      resizedUri = await resizeImageForBlurCheck(uri);
    } catch (error) {
      console.warn('[estimateImageBlurFast] resize failed:', error);
      return buildFailureResult('resize_failed');
    }

    const path = normalizeFilePath(resizedUri);

    let base64: string;
    try {
      base64 = await RNFS.readFile(path, 'base64');
    } catch (error) {
      console.warn('[estimateImageBlurFast] read failed:', error);
      return buildFailureResult('read_failed');
    }

    const bytes = toByteArray(base64);
    const decoded = decode(bytes, { useTArray: true });
    const { data, width, height } = decoded;

    if (!width || !height || !data?.length) {
      return buildFailureResult('empty_image');
    }

    const gray = rgbToGray(data, width, height);
    const analysis = analyzeBlurFromGray(gray, width, height);

    if (__DEV__) logBlurAnalysis(analysis);

    return {
      isBlur: analysis.isBlur,
      variance: analysis.score,
      success: true,
      reason: analysis.usableBlockCount === 0 ? 'low_texture' : undefined,
      debug: buildBlurDebug(analysis),
    };
  } catch (error) {
    console.warn('[estimateImageBlurFast] failed:', error);

    return buildFailureResult('decode_failed');
  } finally {
    await cleanupTempFile(resizedUri);
  }
};
