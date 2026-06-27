import { AccelerometerReading, MotionState, Vector2 } from "../types/motion";
import { FRICTION, MAX_HISTORY, MAX_SPEED, SENSITIVITY } from "../../../constants/motion";
import { WORLD_MARGIN } from "../../../constants/world";

export function createInitialMotionState(
  width: number,
  height: number
): MotionState {
  return {
    position: {
      x: width / 2,
      y: height / 2,
    },

    velocity: {
      x: 0,
      y: 0,
    },

    history: [],
  };
}

function clampVelocity(velocity: Vector2): Vector2 {
  const speed = Math.sqrt(
    velocity.x * velocity.x +
    velocity.y * velocity.y
  );

  if (speed <= MAX_SPEED) {
    return velocity;
  }

  const scale = MAX_SPEED / speed;

  return {
    x: velocity.x * scale,
    y: velocity.y * scale,
  };
}

function clampPosition(
  position: Vector2,
  width: number,
  height: number
): Vector2 {
  return {
    x: Math.min(
      Math.max(position.x, WORLD_MARGIN),
      width - WORLD_MARGIN
    ),
    y: Math.min(
      Math.max(position.y, WORLD_MARGIN),
      height - WORLD_MARGIN
    ),
  };
}

export function simulateMotion(
  currentState: MotionState,
  sensor: AccelerometerReading,
  width: number,
  height: number
): MotionState {
  const nextVelocity = clampVelocity({
    x:
      (currentState.velocity.x +
        sensor.x * SENSITIVITY) *
      FRICTION,

    y:
      (currentState.velocity.y +
        sensor.y * SENSITIVITY) *
      FRICTION,
  });

  const nextPosition = clampPosition(
    {
      x: currentState.position.x + nextVelocity.x,
      y: currentState.position.y + nextVelocity.y,
    },
    width,
    height
  );

  const nextHistory = [
  ...currentState.history,
  nextPosition,
  ];
  const limitedHistory = nextHistory.slice(-MAX_HISTORY);

  return {
    position: nextPosition,
    velocity: nextVelocity,
    history: limitedHistory,
  };
}