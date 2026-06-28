export interface Vector2 {
  x: number;
  y: number;
}

export function v2Add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function v2Sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function v2Mag(v: Vector2): number {
  return Math.hypot(v.x, v.y);
}

export function v2Normalize(v: Vector2): Vector2 {
  const m = v2Mag(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
}
