import type { AccelerometerData } from "./AccelerometerData";
import type { GyroscopeData } from "./GyroscopeData";

export interface SensorFrame {
  accelerometer: AccelerometerData | null;
  gyroscope: GyroscopeData | null;
  timestamp: number;
}