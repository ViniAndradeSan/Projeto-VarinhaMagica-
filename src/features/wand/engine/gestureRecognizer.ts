import type { TrailPoint } from "../types/wandState";
import { SPELLS } from "./spells";
import type { SpellDefinition } from "../types/wandState";

// ─── Utilitários ─────────────────────────────────────────────────────────────

function resample(points: TrailPoint[], n: number): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
  }, 0);

  const interval = totalLength / (n - 1);
  let d = 0;
  const result: Array<{ x: number; y: number }> = [{ x: points[0].x, y: points[0].y }];

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const seg = Math.hypot(dx, dy);
    if (d + seg >= interval) {
      const t = (interval - d) / seg;
      result.push({ x: points[i - 1].x + t * dx, y: points[i - 1].y + t * dy });
      d = 0;
    } else {
      d += seg;
    }
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

function zigzagCount(pts: Array<{ x: number; y: number }>): number {
  let count = 0;
  let lastDx = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    if (Math.abs(dx) > 0.05) {
      const sign = Math.sign(dx);
      if (sign !== 0 && sign !== lastDx) count++;
      lastDx = sign;
    }
  }
  return count;
}

// ─── Shapes correspondentes aos feitiços ────────────────────────────────────
//
//  Lumos           → Círculo (winding > 2π)
//  Expelliarmus    → Z / Ziguezague horizontal (≥ 2 reversões X em linha reta)
//  Alohomora       → Triângulo (3 cantos detectados por mudanças bruscas)
//  Wingardium Leviosa → Linha horizontal longa
//  Avada Kedavra   → Linha vertical longa para baixo

type ShapeType = "circle" | "zigzag" | "triangle" | "horizontal" | "vertical" | null;

function detectShape(trail: TrailPoint[]): ShapeType {
  if (trail.length < 8) return null;

  const raw = resample(trail, 64);
  const pts = normalize(raw);

  const dx = pts[pts.length - 1].x - pts[0].x;
  const dy = pts[pts.length - 1].y - pts[0].y;
  const dist = Math.hypot(dx, dy);

  const w = Math.abs(winding(pts));

  // Círculo: alta torção + ponta perto do início
  if (w > Math.PI * 1.6 && dist < 0.35) return "circle";

  // Ziguezague: muitas inversões no X
  const zz = zigzagCount(pts);
  if (zz >= 3) return "zigzag";

  // Linha horizontal: dx muito maior que dy
  if (Math.abs(dx) > 0.5 && Math.abs(dx) > Math.abs(dy) * 2) return "horizontal";

  // Linha vertical: dy maior e indo para baixo
  if (Math.abs(dy) > 0.5 && Math.abs(dy) > Math.abs(dx) * 2) {
    return dy > 0 ? "vertical" : null;
  }

  // Triângulo aproximado: 3 picos de curvatura
  let corners = 0;
  for (let i = 2; i < pts.length - 2; i++) {
    const ax = pts[i - 1].x - pts[i - 2].x;
    const ay = pts[i - 1].y - pts[i - 2].y;
    const bx = pts[i + 1].x - pts[i].x;
    const by = pts[i + 1].y - pts[i].y;
    const dot = ax * bx + ay * by;
    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);
    if (magA > 0.02 && magB > 0.02) {
      const cos = dot / (magA * magB);
      if (cos < -0.3) corners++;
    }
  }
  if (corners >= 2) return "triangle";

  return null;
}

const SHAPE_TO_SPELL: Record<NonNullable<ShapeType>, string> = {
  circle: "Lumos",
  zigzag: "Expelliarmus",
  triangle: "Alohomora",
  horizontal: "Wingardium Leviosa",
  vertical: "Avada Kedavra",
};

export function recognizeGesture(trail: TrailPoint[]): SpellDefinition | null {
  const shape = detectShape(trail);
  if (!shape) return null;
  const spellName = SHAPE_TO_SPELL[shape];
  return SPELLS.find((s) => s.name === spellName) ?? null;
}
