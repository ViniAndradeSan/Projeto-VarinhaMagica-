import type { SensorFrame } from "../../../core/sensors/types/SensorFrame";
import type { WandState } from "../types/wandState";
import { updatePhysics } from "./physics";
import { updateTrail } from "./trail";
import { updateGestures } from "./gesture";

export function updateEngine(state: WandState, frame: SensorFrame): WandState {
  const next = updatePhysics(state, frame);
  const trailUpdated = updateTrail(next);
  return updateGestures(trailUpdated);
}
