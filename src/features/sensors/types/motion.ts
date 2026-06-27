export interface Vector2 {
  x: number;
  y: number;
}

export interface AccelerometerReading {
  x: number;
  y: number;
  z: number;
}

export type MotionHistory = Vector2[];

export interface MotionState {
  position: Vector2;
  velocity: Vector2;
  history: MotionHistory;
}