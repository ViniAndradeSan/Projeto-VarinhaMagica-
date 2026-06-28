/**
 * Hybrid gesture recognizer — Varinha Mágica v5
 * =========================================================
 * Este motor prioriza templates e usa heurísticas como correção e penalização.
 * Ele mantém compatibilidade com gestos já suportados, mas reduz a dependência
 * de thresholds rígidos e permite reconhecer traços levemente imperfeitos.
 */

import type { TrailPoint, SpellShape, ShapeScore, RecognitionResult } from "../types/wandState";
import { SPELL_BY_SHAPE } from "./spells";

const N = 64;
const MIN_RECOGNITION_SCORE = 0.55;
const NOISE_THRESHOLD = 0.15;
const MIN_POINTS = 6;
const SQUARE_SIZE = 1;
const HALF_DIAGONAL = Math.sqrt(2) * 0.5;
const ANGLE_RANGE = Math.PI / 4;
const ANGLE_PRECISION = Math.PI / 90;
const PHI = 0.5 * (-1 + Math.sqrt(5));

interface Pt { x: number; y: number; }
interface Rectangle { x: number; y: number; width: number; height: number; }

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

function boundingBox(points: Pt[]): Rectangle {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function centroid(points: Pt[]): Pt {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function translateTo(points: Pt[], target: Pt): Pt[] {
  const center = centroid(points);
  return points.map((p) => ({ x: p.x + target.x - center.x, y: p.y + target.y - center.y }));
}

function scaleTo(points: Pt[], size: number): Pt[] {
  const box = boundingBox(points);
  const scale = Math.max(box.width, box.height);
  if (scale === 0) return points.map((p) => ({ ...p }));
  return points.map((p) => ({ x: (p.x / scale) * size, y: (p.y / scale) * size }));
}

function rotateBy(points: Pt[], radians: number): Pt[] {
  const center = centroid(points);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return points.map((p) => ({
    x: (p.x - center.x) * cos - (p.y - center.y) * sin + center.x,
    y: (p.x - center.x) * sin + (p.y - center.y) * cos + center.y,
  }));
}

function pathDistance(pts1: Pt[], pts2: Pt[]): number {
  let distance = 0;
  for (let i = 0; i < pts1.length; i++) {
    distance += dist(pts1[i], pts2[i]);
  }
  return distance / pts1.length;
}

function goldenSectionSearch(pts: Pt[], template: Pt[], a: number, b: number, threshold: number): number {
  let x1 = PHI * a + (1 - PHI) * b;
  let x2 = (1 - PHI) * a + PHI * b;
  let f1 = pathDistance(rotateBy(pts, x1), template);
  let f2 = pathDistance(rotateBy(pts, x2), template);

  while (Math.abs(b - a) > threshold) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = PHI * a + (1 - PHI) * b;
      f1 = pathDistance(rotateBy(pts, x1), template);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = (1 - PHI) * a + PHI * b;
      f2 = pathDistance(rotateBy(pts, x2), template);
    }
  }

  return Math.min(f1, f2);
}

function dollarScore(inputNorm: Pt[], templatePts: Pt[]): number {
  const distance = goldenSectionSearch(inputNorm, templatePts, -ANGLE_RANGE, ANGLE_RANGE, ANGLE_PRECISION);
  return clamp01(1 - distance / HALF_DIAGONAL);
}

function resample(points: Pt[], n: number): Pt[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));

  const interval = pathLength(points) / (n - 1);
  let D = 0;
  const newPoints: Pt[] = [{ ...points[0] }];
  let i = 1;

  while (i < points.length && newPoints.length < n) {
    const prev = points[i - 1];
    const current = points[i];
    const d = dist(prev, current);

    if (D + d >= interval) {
      const t = (interval - D) / d;
      newPoints.push({ x: prev.x + t * (current.x - prev.x), y: prev.y + t * (current.y - prev.y) });
      points = [{ x: newPoints[newPoints.length - 1].x, y: newPoints[newPoints.length - 1].y }, ...points.slice(i)];
      D = 0;
      i = 1;
    } else {
      D += d;
      i += 1;
    }
  }

  while (newPoints.length < n) {
    newPoints.push({ ...points[points.length - 1] });
  }

  return newPoints.slice(0, n);
}

function normalizeInput(trail: TrailPoint[]): Pt[] | null {
  if (trail.length < MIN_POINTS) return null;

  const raw = trail.map((point) => ({ x: point.x, y: point.y }));
  const resampled = resample(raw, N);
  if (resampled.length < MIN_POINTS) return null;

  const scaled = scaleTo(resampled, SQUARE_SIZE);
  return translateTo(scaled, { x: 0, y: 0 });
}

function normalizeTemplate(raw: Pt[]): Pt[] {
  const scaled = scaleTo(raw, SQUARE_SIZE);
  return translateTo(scaled, { x: 0, y: 0 });
}

function makeCircleTemplate(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
}

function makeZigzagTemplate(n: number): Pt[] {
  const segments: Pt[][] = [
    [{ x: -1, y: -1 }, { x: 1, y: -1 }],
    [{ x: 1, y: -1 }, { x: -1, y: 1 }],
    [{ x: -1, y: 1 }, { x: 1, y: 1 }],
  ];
  const pts: Pt[] = [];
  const perSegment = Math.floor(n / 3);

  for (const [start, end] of segments) {
    for (let i = 0; i < perSegment; i++) {
      const t = i / (perSegment - 1);
      pts.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    }
  }

  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  return pts.slice(0, n);
}

function makeTriangleTemplate(n: number): Pt[] {
  const vertices: Pt[] = [
    { x: 0, y: -1 },
    { x: 0.9, y: 0.6 },
    { x: -0.9, y: 0.6 },
    { x: 0, y: -1 },
  ];

  const pts: Pt[] = [];
  const perSide = Math.floor(n / 3);
  for (let side = 0; side < 3; side++) {
    const start = vertices[side];
    const end = vertices[side + 1];
    for (let i = 0; i < perSide; i++) {
      const t = i / perSide;
      pts.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    }
  }

  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  return pts.slice(0, n);
}

function makeHorizontalTemplate(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: -1 + (2 * i) / (n - 1), y: 0 }));
}

function makeVerticalTemplate(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: 0, y: -1 + (2 * i) / (n - 1) }));
}

const NORMALIZED_TEMPLATES: Record<SpellShape, Pt[]> = {
  circle: normalizeTemplate(makeCircleTemplate(N)),
  zigzag: normalizeTemplate(makeZigzagTemplate(N)),
  triangle: normalizeTemplate(makeTriangleTemplate(N)),
  horizontal: normalizeTemplate(makeHorizontalTemplate(N)),
  vertical: normalizeTemplate(makeVerticalTemplate(N)),
};

function computeWinding(pts: Pt[]): number {
  const center = centroid(pts);
  let previous = Math.atan2(pts[0].y - center.y, pts[0].x - center.x);
  let total = 0;

  for (let i = 1; i < pts.length; i++) {
    const current = Math.atan2(pts[i].y - center.y, pts[i].x - center.x);
    let delta = current - previous;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    total += delta;
    previous = current;
  }

  return total;
}

function countHorizontalReversals(pts: Pt[]): number {
  let count = 0;
  let lastSign = 0;

  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    if (Math.abs(dx) > 0.04) {
      const sign = Math.sign(dx);
      if (sign !== 0 && sign !== lastSign) {
        count += 1;
        lastSign = sign;
      }
    }
  }

  return count;
}

function countSharpCorners(pts: Pt[], step = 5): number {
  let corners = 0;

  for (let i = step; i < pts.length - step; i++) {
    const ax = pts[i].x - pts[i - step].x;
    const ay = pts[i].y - pts[i - step].y;
    const bx = pts[i + step].x - pts[i].x;
    const by = pts[i + step].y - pts[i].y;
    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);

    if (magA > 0.08 && magB > 0.08) {
      const cos = (ax * bx + ay * by) / (magA * magB);
      if (cos < -0.4) corners += 1;
    }
  }

  return corners;
}

function closureRatio(pts: Pt[]): number {
  const length = pathLength(pts);
  if (length === 0) return 1;
  return dist(pts[0], pts[pts.length - 1]) / length;
}

function lineStraightness(pts: Pt[]): number {
  const start = pts[0];
  const end = pts[pts.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const baseLength = Math.hypot(dx, dy);

  if (baseLength === 0) return 0;

  let totalDistance = 0;
  for (const point of pts) {
    const cross = Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx);
    totalDistance += cross / baseLength;
  }

  const averageDistance = totalDistance / pts.length;
  return clamp01(1 - averageDistance * 1.75);
}

function aspectRatios(pts: Pt[]) {
  const box = boundingBox(pts);
  const horizontalRatio = box.width + box.height === 0 ? 0.5 : box.width / (box.width + box.height);
  return { horizontalRatio, verticalRatio: 1 - horizontalRatio };
}

function featureSet(pts: Pt[]) {
  const pathLen = pathLength(pts);
  const closure = closureRatio(pts);
  const winding = clamp01(Math.abs(computeWinding(pts)) / (Math.PI * 2));
  const reversals = countHorizontalReversals(pts);
  const corners = countSharpCorners(pts);
  const straightness = lineStraightness(pts);
  const { horizontalRatio, verticalRatio } = aspectRatios(pts);
  const dy = pts[pts.length - 1].y - pts[0].y;
  const downness = dy > 0 ? verticalRatio : verticalRatio * 0.25;
  const pathLengthScore = clamp01((pathLen - 0.8) / 2.2);

  return {
    pathLength: pathLen,
    pathLengthScore,
    closure,
    winding,
    reversals,
    corners,
    straightness,
    horizontalRatio,
    verticalRatio,
    downness,
    dx: pts[pts.length - 1].x - pts[0].x,
    dy,
  };
}

function shapeEvidence(shape: SpellShape, features: ReturnType<typeof featureSet>): number {
  const isClosed = clamp01(1 - features.closure / 0.3);
  const isStraight = features.straightness;
  const isCurvy = 1 - features.straightness;

  switch (shape) {
    case "circle":
      return average([
        isClosed,
        clamp01(features.winding / 0.6),
        clamp01(1 - features.corners / 2),
        clamp01(1 - features.reversals / 2),
        isCurvy,
      ]);

    case "zigzag":
      return average([
        clamp01(features.reversals / 3),
        clamp01(features.horizontalRatio / 0.75),
        clamp01(1 - features.winding),
        clamp01(1 - features.closure),
        clamp01(features.straightness * 0.6 + 0.2),
      ]);

    case "triangle":
      return average([
        clamp01(features.corners / 1.5),
        clamp01(features.winding / 0.65),
        clamp01(1 - features.reversals / 3),
        isClosed,
        clamp01(isCurvy * 0.8 + 0.1),
      ]);

    case "horizontal":
      return average([
        features.horizontalRatio,
        isStraight,
        clamp01(1 - features.winding / 0.4),
        clamp01(1 - features.reversals / 2),
        features.pathLengthScore,
      ]);

    case "vertical":
      return average([
        features.verticalRatio,
        isStraight,
        clamp01(1 - features.winding / 0.4),
        clamp01(1 - features.reversals / 2),
        features.downness,
        features.pathLengthScore,
      ]);
  }
}

function scoreShape(shape: SpellShape, normPts: Pt[], features: ReturnType<typeof featureSet>): number {
  const templateScore = dollarScore(normPts, NORMALIZED_TEMPLATES[shape]);
  const evidence = shapeEvidence(shape, features);
  return clamp01(templateScore * 0.7 + evidence * 0.3);
}

export function scoreAllShapes(trail: TrailPoint[]): ShapeScore[] {
  const normPts = normalizeInput(trail);
  if (!normPts) return [];

  const features = featureSet(normPts);
  const shapes: SpellShape[] = ["circle", "zigzag", "triangle", "horizontal", "vertical"];

  return shapes.map((shape) => ({
    shape,
    score: scoreShape(shape, normPts, features),
  }));
}

function buildDebug(features: ReturnType<typeof featureSet>) {
  return {
    winding: features.winding,
    corners: features.corners,
    reversals: features.reversals,
    closure: features.closure,
    pathLength: features.pathLength,
    horizontalRatio: features.horizontalRatio,
    verticalRatio: features.verticalRatio,
    lineStraightness: features.straightness,
  };
}

export function recognizeGesture(trail: TrailPoint[]): RecognitionResult {
  const normPts = normalizeInput(trail);
  const features = normPts
    ? featureSet(normPts)
    : {
        pathLength: 0,
        pathLengthScore: 0,
        closure: 1,
        winding: 0,
        reversals: 0,
        corners: 0,
        straightness: 0,
        horizontalRatio: 0.5,
        verticalRatio: 0.5,
        downness: 0,
        dx: 0,
        dy: 0,
      };

  const scores = normPts ? scoreAllShapes(trail) : [];
  const ranking = [...scores].sort((a, b) => b.score - a.score);
  const best = ranking[0] ?? { shape: "circle" as SpellShape, score: 0 };
  const debug = buildDebug(features);

  if (!normPts || scores.length === 0) {
    return { kind: "noise", confidence: 0, ranking: [], debug };
  }

  if (best.score >= MIN_RECOGNITION_SCORE) {
    const spell = SPELL_BY_SHAPE[best.shape];
    if (!spell) {
      return { kind: "failure", confidence: best.score, ranking, debug };
    }
    return { kind: "recognized", spell, winner: spell, confidence: best.score, ranking, debug };
  }

  if (best.score >= NOISE_THRESHOLD) {
    return { kind: "failure", confidence: best.score, ranking, debug };
  }

  return { kind: "noise", confidence: best.score, ranking, debug };
}
