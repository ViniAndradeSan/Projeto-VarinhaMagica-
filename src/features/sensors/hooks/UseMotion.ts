import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { useSharedValue, SharedValue } from "react-native-reanimated";

import { useAccelerometer } from "./useAccelerometer";
import { createInitialMotionState, simulateMotion } from "../services/MotionService";
import { MotionState } from "../types/motion";

export function useMotion(): { x: SharedValue<number>; y: SharedValue<number> } {
  const sensor = useAccelerometer();
  const { width, height } = useWindowDimensions();

  const initial = createInitialMotionState(width, height);
  const x = useSharedValue(initial.position.x);
  const y = useSharedValue(initial.position.y);

  // guarda o estado físico completo (posição + velocidade) numa ref mutável,
  // já que sharedValue por si só não te dá "estado anterior" de forma síncrona aqui
  const stateRef = useSharedValue<MotionState>(initial);

  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    const reset = createInitialMotionState(width, height);
    stateRef.value = reset;
    x.value = reset.position.x;
    y.value = reset.position.y;
  }, [width, height]);

  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    const next = simulateMotion(stateRef.value, sensor, width, height);
    stateRef.value = next;
    x.value = next.position.x;
    y.value = next.position.y;
  }, [sensor, width, height]);

  return { x, y };
}