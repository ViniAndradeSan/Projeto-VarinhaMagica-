import { Vector2 } from "@/features/sensors/types/motion";

export function distance(a: Vector2, b: Vector2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}