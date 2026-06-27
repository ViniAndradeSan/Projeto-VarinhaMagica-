// useAccelerometer.ts — versão sem re-render
import { useEffect } from "react";
import { Accelerometer } from "expo-sensors";
import { useSharedValue, SharedValue } from "react-native-reanimated";
import { AccelerometerReading } from "../types/motion";
import { SensorInterval } from "@/constants/sensor";

export function useAccelerometer(): SharedValue<AccelerometerReading> {
  const reading = useSharedValue<AccelerometerReading>({ x:0, y:0, z:0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(SensorInterval);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      reading.value = { x, y, z }; // direto pra UI thread, zero re-render
    });
    return () => subscription.remove();
  }, []);

  return reading;
}