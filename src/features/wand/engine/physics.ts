import type { SensorFrame } from "../../../core/sensors/types/SensorFrame";
import type { WandState } from "../types/wandState";

const MIN_DT = 0.016;
const MAX_DT = 0.08;
const FRICTION = 3.6;
const MAX_SPEED = 1.4;
const MIN_CURSOR = 0.03;
const MAX_CURSOR = 0.97;
const SENSITIVITY = 1.1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function updatePhysics(state: WandState, frame: SensorFrame): WandState {
  const now = frame.timestamp ?? state.timestamp;
  if (!frame.gyroscope) {
    return {
      ...state,
      timestamp: now,
      speed: 0,
      isMoving: false,
    };
  }

  const dt = clamp((now - state.timestamp) / 1000, MIN_DT, MAX_DT);
  const { x: gx, y: gy, z: gz } = frame.gyroscope;

  const acceleration = {
    x: clamp(-gy * SENSITIVITY, -2.2, 2.2),
    y: clamp(gx * SENSITIVITY, -2.2, 2.2),
  };

  const velocity = {
    x: state.velocity.x + acceleration.x * dt,
    y: state.velocity.y + acceleration.y * dt,
  };

  const damped = {
    x: velocity.x * (1 - Math.min(FRICTION * dt, 0.92)),
    y: velocity.y * (1 - Math.min(FRICTION * dt, 0.92)),
  };

  const speed = clamp(Math.hypot(damped.x, damped.y), 0, MAX_SPEED);

  const cursor = {
    x: clamp(state.cursor.x + damped.x * dt, MIN_CURSOR, MAX_CURSOR),
    y: clamp(state.cursor.y + damped.y * dt, MIN_CURSOR, MAX_CURSOR),
  };

  return {
    ...state,
    orientation: {
      pitch: state.orientation.pitch + gx * dt * 0.8,
      roll: state.orientation.roll + gy * dt * 0.8,
      yaw: state.orientation.yaw + gz * dt * 0.8,
    },
    cursor,
    velocity: damped,
    speed,
    isMoving: speed > 0.06,
    timestamp: now,
  };
}
