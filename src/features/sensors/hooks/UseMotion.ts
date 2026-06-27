// useMotion.ts — cálculo roda em worklet, reagindo ao sharedValue do sensor
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { useSharedValue, useAnimatedReaction } from "react-native-reanimated";
import { useAccelerometer } from "./useAccelerometer";
import { createInitialMotionState, simulateMotion } from "../services/MotionService";

export function useMotion() {
  const sensor = useAccelerometer();
  const { width, height } = useWindowDimensions();

  const initial = createInitialMotionState(width, height);
  const x = useSharedValue(initial.position.x);
  const y = useSharedValue(initial.position.y);
  const stateRef = useSharedValue(initial);

  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    const reset = createInitialMotionState(width, height);
    stateRef.value = reset;
    x.value = reset.position.x;
    y.value = reset.position.y;
  }, [width, height]);

  useAnimatedReaction(
    () => sensor.value,
    (current) => {
      // roda no worklet/UI thread, sem nunca tocar o React
      const next = simulateMotion(stateRef.value, current, width, height);
      stateRef.value = next;
      x.value = next.position.x;
      y.value = next.position.y;
    },
    [width, height]
  );

  return { x, y };
}