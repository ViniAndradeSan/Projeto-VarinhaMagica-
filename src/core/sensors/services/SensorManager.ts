import type { AccelerometerData } from "../types/AccelerometerData";
import type { GyroscopeData } from "../types/GyroscopeData";


export interface SensorFrame {
  accelerometer: AccelerometerData | null;
  gyroscope: GyroscopeData | null;
}

export class SensorManager {

  private frame: SensorFrame = {
    accelerometer: null,
    gyroscope: null,
  };

  public updateAccelerometer(data: AccelerometerData): void {
    this.frame.accelerometer = data;
  }

  public updateGyroscope(data: GyroscopeData): void {
    this.frame.gyroscope = data;
  }

  public getFrame(): SensorFrame {
    return this.frame;
  }
}
