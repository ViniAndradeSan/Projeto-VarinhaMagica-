import type { TrailPoint } from "../types/wandState";
import { SPELLS } from "./spells";
import type { SpellDefinition } from "../types/wandState";

// ─── Configuração de tolerância ──────────────────────────────────────────────
// MIN_SCORE: score mínimo para aceitar uma forma (0=qualquer coisa, 1=perfeito)
// NOISE_THRESHOLD: score máximo para considerar o gesto "nada" (traço sem forma)
// Se o melhor score estiver entre NOISE_THRESHOLD e MIN_SCORE → gesto errado (vibra)
// Se o melhor score < NOISE_THRESHOLD → traço curto/aleatório, ignora silencioso
const MIN_SCORE = 0.52;       // precisa ter ≥52% de certeza para reconhecer
const NOISE_THRESHOLD = 0.28; // abaixo disso é ruído/rabisco pequeno demais

// ─── Utilitários ─────────────────────────────────────────────────────────────

function resample(points: TrailPoint[], n: number): Array<{ x: number; y: number }> {
  if (points.length < 2) return [];

  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
  }, 0);

  if (totalLength === 0) return [];

  const interval = totalLength / (n - 1);
  let d = 0;
  const result: Array<{ x: number; y: number }> = [{ x: points[0].x, y: points[0].y }];

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const seg = Math.hypot(dx, dy);
    let remaining = seg;

    while (d + remaining >= interval) {
      const t = (interval - d) / remaining;
      const x = points[i - 1].x + t * (points[i].x - points[i - 1].x);
      const y = points[i - 1].y + t * (points[i].y - points[i - 1].y);
      result.push({ x, y });
      remaining = d + remaining - interval;
      d = 0;
      if (result.length >= n) break;
    }
    if (result.length >= n) break;
    d += remaining;
  }

  while (result.length < n) result.push(result[result.length - 1]);
  return result.slice(0, n);
}

function normalize(pts: Array<{ x: number; y: number }>) {
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const scale = Math.max(maxX - minX, maxY - minY) || 1;
  return pts.map((p) => ({ x: (p.x - minX) / scale, y: (p.y - minY) / scale }));
}

function totalPathLength(pts: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function winding(pts: Array<{ x: number; y: number }>): number {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  let last = Math.atan2(pts[0].y - cy, pts[0].x - cx);
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = Math.atan2(pts[i].y - cy, pts[i].x - cx);
    let d = a - last;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    total += d;
    last = a;
  }
  return total;
}

// Conta inversões de direção horizontal (para ziguezague)
function zigzagReversals(pts: Array<{ x: number; y: number }>): number {
  let count = 0;
  let lastSign = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    if (Math.abs(dx) > 0.03) {
      const s = Math.sign(dx);
      if (s !== 0 && s !== lastSign) { count++; lastSign = s; }
    }
  }
  return count;
}

// Conta cantos bruscos (para triângulo)
function sharpCorners(pts: Array<{ x: number; y: number }>): number {
  let corners = 0;
  const step = 3;
  for (let i = step; i < pts.length - step; i++) {
    const ax = pts[i].x - pts[i - step].x;
    const ay = pts[i].y - pts[i - step].y;
    const bx = pts[i + step].x - pts[i].x;
    const by = pts[i + step].y - pts[i].y;
    const dot = ax * bx + ay * by;
    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);
    if (magA > 0.01 && magB > 0.01) {
      const cos = dot / (magA * magB);
      if (cos < -0.35) corners++;
    }
  }
  return corners;
}

// ─── Scores individuais por forma ────────────────────────────────────────────

type ShapeName = "circle" | "zigzag" | "triangle" | "horizontal" | "vertical";

interface ShapeScore { shape: ShapeName; score: number; }

function scoreAllShapes(trail: TrailPoint[]): ShapeScore[] {
  if (trail.length < 8) return [];

  const raw = resample(trail, 64);
  if (raw.length < 8) return [];
  const pts = normalize(raw);

  const dx = pts[pts.length - 1].x - pts[0].x;
  const dy = pts[pts.length - 1].y - pts[0].y;
  const dist = Math.hypot(dx, dy);       // distância ponta-a-ponta (normalizada)
  const pathLen = totalPathLength(pts);  // comprimento total do traço

  const w     = Math.abs(winding(pts));
  const zz    = zigzagReversals(pts);
  const crnrs = sharpCorners(pts);
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // ── Círculo ────────────────────────────────────────────────────────────────
  // Requer: alta torção (≥ π) + traço fecha perto do início + traço longo
  const circleWinding  = Math.min(1, w / (Math.PI * 1.4));
  const circleClosure  = Math.max(0, 1 - dist / 0.45);
  const circleLength   = Math.min(1, pathLen / 1.8);
  // penaliza se tiver muitos ziguezagues (seria um Z, não círculo)
  const circleZzPenal  = zz >= 4 ? 0.3 : 1.0;
  const circleScore = (circleWinding * 0.45 + circleClosure * 0.35 + circleLength * 0.2) * circleZzPenal;

  // ── Ziguezague ─────────────────────────────────────────────────────────────
  // Requer: ≥ 3 inversões X + traço horizontal mais que vertical
  const zzReversalScore = Math.min(1, zz / 4);
  // penaliza se parece círculo (muito winding)
  const zzWindPenal   = w > Math.PI * 1.2 ? 0.25 : 1.0;
  // precisa ter eixo horizontal dominante
  const zzAxisScore   = absDx > 0.1 ? Math.min(1, absDx / (absDx + absDy + 0.001)) : 0;
  const zigzagScore   = (zzReversalScore * 0.6 + zzAxisScore * 0.4) * zzWindPenal;

  // ── Linha horizontal ───────────────────────────────────────────────────────
  // Requer: dx muito maior que dy, traço direto (pouco winding)
  const horizRatio     = absDy > 0.001 ? absDx / (absDx + absDy) : 1;
  const horizExtent    = Math.min(1, absDx / 0.45);
  const horizStraight  = Math.max(0, 1 - w / (Math.PI * 0.8)); // penaliza curvas
  const horizZzPenal   = zz >= 3 ? 0.35 : 1.0;                 // penaliza ziguezague
  const horizontalScore = (horizRatio * 0.45 + horizExtent * 0.35 + horizStraight * 0.2) * horizZzPenal;

  // ── Linha vertical ─────────────────────────────────────────────────────────
  // Requer: dy muito maior que dx, direção para baixo, traço direto
  const vertRatio      = absDx > 0.001 ? absDy / (absDy + absDx) : 1;
  const vertExtent     = Math.min(1, absDy / 0.45);
  const vertStraight   = Math.max(0, 1 - w / (Math.PI * 0.8));
  const vertDown       = dy > 0 ? 1.0 : 0.3; // penaliza movimento para cima
  const vertZzPenal    = zz >= 3 ? 0.35 : 1.0;
  const verticalScore  = (vertRatio * 0.40 + vertExtent * 0.30 + vertStraight * 0.15 + vertDown * 0.15) * vertZzPenal;

  // ── Triângulo ──────────────────────────────────────────────────────────────
  // Requer: ≥ 2 cantos nítidos + traço razoavelmente longo
  const triCorners     = Math.min(1, crnrs / 2.5);
  const triLength      = Math.min(1, pathLen / 1.5);
  // penaliza se parece círculo (alta torção)
  const triWindPenal   = w > Math.PI * 1.5 ? 0.2 : 1.0;
  const triangleScore  = (triCorners * 0.65 + triLength * 0.35) * triWindPenal;

  return [
    { shape: "circle",     score: Math.min(1, Math.max(0, circleScore)) },
    { shape: "zigzag",     score: Math.min(1, Math.max(0, zigzagScore)) },
    { shape: "horizontal", score: Math.min(1, Math.max(0, horizontalScore)) },
    { shape: "vertical",   score: Math.min(1, Math.max(0, verticalScore)) },
    { shape: "triangle",   score: Math.min(1, Math.max(0, triangleScore)) },
  ];
}

const SHAPE_TO_SPELL: Record<ShapeName, string> = {
  circle:     "Lumos",
  zigzag:     "Expelliarmus",
  triangle:   "Alohomora",
  horizontal: "Wingardium Leviosa",
  vertical:   "Avada Kedavra",
};

// Retorna: spell encontrado, null (ruído/traço pequeno), ou "error" (traço real mas não reconhecido)
export function recognizeGesture(trail: TrailPoint[]): SpellDefinition | null | "error" {
  const scores = scoreAllShapes(trail);
  if (scores.length === 0) return null; // pontos demais pequenos → ignora

  const best = scores.reduce((a, b) => (a.score > b.score ? a : b));

  if (best.score >= MIN_SCORE) {
    // Reconhecido com confiança
    const spellName = SHAPE_TO_SPELL[best.shape];
    return SPELLS.find((s) => s.name === spellName) ?? null;
  }

  if (best.score >= NOISE_THRESHOLD) {
    // Tem forma mas não é clara o suficiente → gesto errado, vibra
    return "error";
  }

  // Score muito baixo → rabisco aleatório pequeno, ignora silencioso
  return null;
}
