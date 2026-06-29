import type { TrailPoint, SpellShape, ShapeScore, RecognitionResult } from "../types/wandState";
import { SPELL_BY_SHAPE } from "./spells";
import { DEBUG, MIN_POINTS, N, SQUARE_SIZE, ANGLE_RANGE, ANGLE_PRECISION,
         HALF_DIAGONAL, START_SAMPLES, PHI,
         MIN_RECOGNITION_SCORE, NOISE_THRESHOLD } from "../constants/world";

interface Pt { x: number; y: number; }
interface Rectangle { x: number; y: number; width: number; height: number; }

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}


function bandScore(value: number, center: number, halfWidth: number): number {
  const d = Math.abs(value - center);
  return Math.max(0, 1 - d / halfWidth);
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

function startVariations(pts: Pt[], includeReverse: boolean): Pt[][] {
  const variations: Pt[][] = [];
  const forms = includeReverse ? [pts, [...pts].reverse()] : [pts];

  for (const form of forms) {
    const len = form.length;
    for (let s = 0; s < START_SAMPLES; s++) {
      const offset = Math.round((s / START_SAMPLES) * len) % len;
      const rotated = form.slice(offset).concat(form.slice(0, offset));
      variations.push(rotated);
    }
  }
  return variations;
}

function dollarScore(inputNorm: Pt[], templatePts: Pt[], allowRotation: boolean): number {
  const distance = allowRotation
    ? goldenSectionSearch(inputNorm, templatePts, -ANGLE_RANGE, ANGLE_RANGE, ANGLE_PRECISION)
    : pathDistance(inputNorm, templatePts);
  return clamp01(1 - distance / HALF_DIAGONAL);
}

function dollarBest(inputNorm: Pt[], templates: Pt[][], opts: { rotation: boolean; reverse: boolean }): number {
  const variations = startVariations(inputNorm, opts.reverse);
  let best = 0;
  for (const tmpl of templates) {
    for (const variation of variations) {
      const s = dollarScore(variation, tmpl, opts.rotation);
      if (s > best) best = s;
    }
  }
  return best;
}

const MATCH_POLICY: Record<SpellShape, { rotation: boolean; reverse: boolean }> = {
  circle:     { rotation: true,  reverse: true },
  triangle:   { rotation: true,  reverse: true },
  zigzag:     { rotation: false, reverse: true },
  horizontal: { rotation: false, reverse: true },
  vertical:   { rotation: false, reverse: true },
};

function resample(points: Pt[], n: number): Pt[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));

  const work = points.map((p) => ({ ...p })); // cópia mutável (sofre splice)
  const total = pathLength(work);
  if (total === 0) return work.map((p) => ({ ...p }));

  const interval = total / (n - 1);
  const result: Pt[] = [{ x: work[0].x, y: work[0].y }];
  let D = 0;
  let prev = work[0];

  for (let i = 1; i < work.length; i++) {
    const cur = work[i];
    const d = dist(prev, cur);
    if (D + d >= interval) {
      const t = (interval - D) / d;
      const nx = prev.x + t * (cur.x - prev.x);
      const ny = prev.y + t * (cur.y - prev.y);
      const sample: Pt = { x: nx, y: ny };
      result.push(sample);
      work.splice(i, 0, sample); 
      prev = sample;
      D = 0;
    } else {
      D += d;
      prev = cur;
    }
  }

  const last = work[work.length - 1];
  while (result.length < n) result.push({ x: last.x, y: last.y });
  result[n - 1] = { x: last.x, y: last.y };

  return result.slice(0, n);
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
  const segments: [Pt, Pt][] = [
    [{ x: -1, y: -1 }, { x: 1, y: -1 }],
    [{ x: 1, y: -1 }, { x: -1, y: 1 }],
    [{ x: -1, y: 1 }, { x: 1, y: 1 }],
  ];
  const pts: Pt[] = [];
  const perSegment = Math.floor(n / 3);

  for (let s = 0; s < segments.length; s++) {
    const [start, end] = segments[s];
    const isLast = s === segments.length - 1;
    const count = isLast ? perSegment + 1 : perSegment;
    for (let i = 0; i < count; i++) {
      const t = i / perSegment;
      pts.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    }
  }

  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  return pts.slice(0, n);
}

function makeTriangleTemplates(n: number): Pt[][] {
  const vertices: Pt[] = [
    { x: 0, y: -1 },
    { x: 0.9, y: 0.6 },
    { x: -0.9, y: 0.6 },
  ];

  function buildFrom(startIdx: number): Pt[] {
    const pts: Pt[] = [];
    const perSide = Math.floor(n / 3);
    for (let side = 0; side < 3; side++) {
      const from = vertices[(startIdx + side) % 3];
      const to = vertices[(startIdx + side + 1) % 3];
      for (let i = 0; i < perSide; i++) {
        const t = i / perSide;
        pts.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
      }
    }
    while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
    return normalizeTemplate(pts.slice(0, n));
  }

  return [buildFrom(0), buildFrom(1), buildFrom(2)];
}

function makeHorizontalTemplate(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: -1 + (2 * i) / (n - 1), y: 0 }));
}

function makeVerticalTemplate(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: 0, y: -1 + (2 * i) / (n - 1) }));
}

const NORMALIZED_TEMPLATES: Record<SpellShape, Pt[][]> = {
  circle:     [normalizeTemplate(makeCircleTemplate(N))],
  zigzag:     [normalizeTemplate(makeZigzagTemplate(N))],
  triangle:   makeTriangleTemplates(N),
  horizontal: [normalizeTemplate(makeHorizontalTemplate(N))],
  vertical:   [normalizeTemplate(makeVerticalTemplate(N))],
};

// ---------- Features geométricas ----------

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

// Consistência de raio (coeficiente de variação). Círculo ~CV baixo; polígono ~CV alto.
function radiusConsistency(pts: Pt[]): number {
  const c = centroid(pts);
  const radii = pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y));
  const mean = radii.reduce((s, r) => s + r, 0) / radii.length;
  if (mean === 0) return 0;
  const variance = radii.reduce((s, r) => s + (r - mean) ** 2, 0) / radii.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - cv / 0.15);
}

// Orientação via PCA (eixo principal). Imune a ponto de início e direção.
function dominantAngle(pts: Pt[]): number {
  const c = centroid(pts);
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) {
    const dx = p.x - c.x, dy = p.y - c.y;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  return 0.5 * Math.atan2(2 * sxy, sxx - syy); // [-π/2, π/2]
}

function horizontalAlignment(pts: Pt[]): number {
  const a = Math.abs(dominantAngle(pts)); // 0 = horizontal
  return clamp01(1 - a / (Math.PI / 4));
}

function verticalAlignment(pts: Pt[]): number {
  const a = Math.abs(dominantAngle(pts));
  return clamp01(1 - Math.abs(a - Math.PI / 2) / (Math.PI / 4));
}

// CORREÇÃO A — reversões horizontais robustas por histerese.
// Conta mudanças de direção em X usando extremos locais com banda morta,
// imune a micro-tremores e ao threshold adaptativo "engolir" a diagonal do Z.
// Z verdadeiro => 2. Multi-zigzag => muitas (rejeitado pela banda).
function countHorizontalReversals(pts: Pt[]): number {
  const xs = pts.map((p) => p.x);
  const range = Math.max(...xs) - Math.min(...xs);
  if (range === 0) return 0;
  const hysteresis = range * 0.15;

  let count = 0;
  let direction = 0;
  let lastExtreme = xs[0];

  for (let i = 1; i < xs.length; i++) {
    const delta = xs[i] - lastExtreme;
    if (Math.abs(delta) > hysteresis) {
      const newDir = Math.sign(delta);
      if (direction !== 0 && newDir !== direction) {
        count += 1;
      }
      direction = newDir;
      lastExtreme = xs[i];
    } else if (direction !== 0) {
      if (direction > 0 && xs[i] > lastExtreme) lastExtreme = xs[i];
      if (direction < 0 && xs[i] < lastExtreme) lastExtreme = xs[i];
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
  const rawWinding = Math.abs(computeWinding(pts));
  const reversals = countHorizontalReversals(pts);
  const corners = countSharpCorners(pts);
  const straightness = lineStraightness(pts);
  const { horizontalRatio, verticalRatio } = aspectRatios(pts);
  const radiusCV = radiusConsistency(pts);
  const hAlign = horizontalAlignment(pts);
  const vAlign = verticalAlignment(pts);
  const pathLengthScore = clamp01((pathLen - 0.8) / 2.2);

  return {
    pathLength: pathLen,
    pathLengthScore,
    closure,
    rawWinding,
    reversals,
    corners,
    straightness,
    horizontalRatio,
    verticalRatio,
    radiusConsistency: radiusCV,
    hAlign,
    vAlign,
  };
}

type Features = ReturnType<typeof featureSet>;

function shapeEvidence(shape: SpellShape, features: Features): number {
  const isClosed = clamp01(1 - features.closure / 0.3);
  const isStraight = features.straightness;
  const isCurvy = 1 - features.straightness;
  const isOpen = clamp01(features.closure / 0.25); // aberto = score alto

  switch (shape) {
    case "circle":
      return average([
        isClosed,
        bandScore(features.rawWinding, Math.PI * 2, Math.PI),
        features.radiusConsistency,
        clamp01(1 - features.corners / 2),
        isCurvy,
      ]);

    // Z: discriminantes FORTES = 2 reversões + aberto + horizontalmente largo.
    // Cantos têm peso menor (Z manual tem cantos obtusos), com banda tolerante.
    case "zigzag":
      return average([
        bandScore(features.reversals, 2, 1.5),  // pico em 2; >=3.5 => 0
        isOpen,                                   // Z não fecha
        clamp01(features.horizontalRatio / 0.6),  // largo
        bandScore(features.corners, 2, 3),        // tolerante (0..5)
        clamp01(1 - features.rawWinding / Math.PI),
      ]);

    case "triangle":
      return average([
        bandScore(features.corners, 3, 2),
        bandScore(features.rawWinding, Math.PI * 2, Math.PI),
        clamp01(1 - features.radiusConsistency), // anti-círculo
        isClosed,
        clamp01(1 - features.reversals / 4),
      ]);

    case "horizontal":
      return average([
        features.hAlign,
        isStraight,
        clamp01(1 - features.reversals / 2), // linha não tem reversões
        clamp01(1 - features.rawWinding / (Math.PI * 0.4)),
        features.pathLengthScore,
      ]);

    case "vertical":
      return average([
        features.vAlign,
        isStraight,
        clamp01(1 - features.reversals / 2),
        clamp01(1 - features.rawWinding / (Math.PI * 0.4)),
        features.pathLengthScore,
      ]);
  }
}

// min(templateScore, evidence) — sem fator mágico.
function scoreShape(shape: SpellShape, normPts: Pt[], features: Features): number {
  const templateScore = dollarBest(normPts, NORMALIZED_TEMPLATES[shape], MATCH_POLICY[shape]);
  const evidence = shapeEvidence(shape, features);
  return clamp01(Math.min(templateScore, evidence));
}

export function scoreAllShapes(trail: TrailPoint[]): ShapeScore[] {
  const normPts = normalizeInput(trail);
  if (!normPts) return [];

  const features = featureSet(normPts);
  const shapes: SpellShape[] = ["circle", "zigzag", "triangle", "horizontal", "vertical"];

  if (DEBUG) debugTrace(trail);

  return shapes.map((shape) => ({
    shape,
    score: scoreShape(shape, normPts, features),
  }));
}

function buildDebug(features: Features) {
  return {
    winding: features.rawWinding / (Math.PI * 2),
    corners: features.corners,
    reversals: features.reversals,
    closure: features.closure,
    pathLength: features.pathLength,
    horizontalRatio: features.horizontalRatio,
    verticalRatio: features.verticalRatio,
    lineStraightness: features.straightness,
    radiusConsistency: features.radiusConsistency,
    hAlign: features.hAlign,
    vAlign: features.vAlign,
  };
}

// Ferramenta de diagnóstico: imprime features e a decomposição de cada score.
// Desenhe a forma que falha e leia os números no console.
export function debugTrace(trail: TrailPoint[]) {
  const normPts = normalizeInput(trail);
  if (!normPts) {
    console.log("[debugTrace] normPts = null (poucos pontos?)");
    return;
  }
  const f = featureSet(normPts);

  console.log("[debugTrace] FEATURES:");
  console.table({
    reversals: f.reversals,
    corners: f.corners,
    rawWinding: (f.rawWinding / Math.PI).toFixed(2) + "π",
    closure: f.closure.toFixed(3),
    straightness: f.straightness.toFixed(3),
    horizontalRatio: f.horizontalRatio.toFixed(3),
    verticalRatio: f.verticalRatio.toFixed(3),
    radiusConsistency: f.radiusConsistency.toFixed(3),
    hAlign: f.hAlign.toFixed(3),
    vAlign: f.vAlign.toFixed(3),
  });

  const shapes: SpellShape[] = ["circle", "zigzag", "triangle", "horizontal", "vertical"];
  console.log("[debugTrace] SCORES (template / evidence / min):");
  console.table(
    shapes.map((shape) => {
      const template = dollarBest(normPts, NORMALIZED_TEMPLATES[shape], MATCH_POLICY[shape]);
      const evidence = shapeEvidence(shape, f);
      return {
        shape,
        template: template.toFixed(3),
        evidence: evidence.toFixed(3),
        final: Math.min(template, evidence).toFixed(3),
      };
    })
  );
}

export function recognizeGesture(trail: TrailPoint[]): RecognitionResult {
  const normPts = normalizeInput(trail);
  const features: Features = normPts
    ? featureSet(normPts)
    : {
        pathLength: 0,
        pathLengthScore: 0,
        closure: 1,
        rawWinding: 0,
        reversals: 0,
        corners: 0,
        straightness: 0,
        horizontalRatio: 0.5,
        verticalRatio: 0.5,
        radiusConsistency: 0,
        hAlign: 0,
        vAlign: 0,
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
