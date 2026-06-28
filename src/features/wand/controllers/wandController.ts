import { updateEngine } from "../engine/update";
import type { WandState } from "../types/wandState";
import type { SensorFrame } from "@/core/sensors/types/SensorFrame";

export class WandController {
  private state: WandState;

  constructor(initialState: WandState) {
    this.state = initialState;
  }

  public tick(frame: SensorFrame) {
    this.state = updateEngine(this.state, frame);
  }

  public getState(): WandState {
    return this.state;
  }
}
