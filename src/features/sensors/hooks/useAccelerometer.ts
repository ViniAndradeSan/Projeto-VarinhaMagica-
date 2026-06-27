import { useEffect, useState } from "react";
import { Accelerometer } from "expo-sensors";
import { AccelerometerReading } from "../types/motion";
import { SensorInterval } from "@/constants/sensor";

export function useAccelerometer() {
  const [values, setValues] = useState<AccelerometerReading>({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    Accelerometer.setUpdateInterval(SensorInterval);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      setValues({ x, y, z });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return values;
}
