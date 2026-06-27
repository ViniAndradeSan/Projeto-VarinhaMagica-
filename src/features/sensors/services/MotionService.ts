import { AccelerometerReading, MotionState, Vector2 } from "../types/motion";
import { FRICTION, MAX_SPEED, SENSITIVITY } from "../constants/motion";

export function createInitialMotionState(
  width: number,
  height: number
): MotionState {
  return {
    position: { x: width / 2, y: height / 2 },
    velocity: { x: 0, y: 0 },
  };
}

function clampVelocity(velocity: Vector2): Vector2 {
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

  if (speed <= MAX_SPEED) {
    return velocity;
  }

  const scale = MAX_SPEED / speed;
  return {
    x: velocity.x * scale,
    y: velocity.y * scale,
  };
}

export function simulateMotion(
  currentState: MotionState,
  sensor: AccelerometerReading
): MotionState {
  const nextVelocity: Vector2 = clampVelocity({
    x: (currentState.velocity.x + sensor.x * SENSITIVITY) * FRICTION,
    y: (currentState.velocity.y + sensor.y * SENSITIVITY) * FRICTION,
  });

  const nextPosition: Vector2 = {
    x: currentState.position.x + nextVelocity.x,
    y: currentState.position.y + nextVelocity.y,
  };

  return {
    position: nextPosition,
    velocity: nextVelocity,
  };
}
