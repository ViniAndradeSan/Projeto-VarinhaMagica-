export interface Vector2 {
  x: number;
  y: number;
}

export interface Orientation {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface TrailPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface SpellState {
  name: string;
  alpha: number;
  startedAt: number;
  duration: number;
}

export interface WandState {
  orientation: Orientation;
  cursor: Vector2;
  velocity: Vector2;
  speed: number;
  isMoving: boolean;
  trail: TrailPoint[];
  timestamp: number;
  spell: SpellState | null;
}