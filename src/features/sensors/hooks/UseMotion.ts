import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";

import { useAccelerometer } from "./useAccelerometer";

import {
  createInitialMotionState,
  simulateMotion,
} from "../services/MotionService";

import { MotionState } from "../types/motion";

export function useMotion(): MotionState {
  const sensor = useAccelerometer();

  const { width, height } = useWindowDimensions();

  const [motionState, setMotionState] =
    useState<MotionState>(() =>
      createInitialMotionState(width, height)
    );

  useEffect(() => {
    if (width <= 0 || height <= 0) {
      return;
    }

    setMotionState(
      createInitialMotionState(width, height)
    );
  }, [width, height]);

 useEffect(() => {
  if (width <= 0 || height <= 0) {
    return;
  }

  setMotionState(previous => {
    const next = simulateMotion(
      previous,
      sensor,
      width,
      height
    );

    console.log("sensor", sensor);
    console.log("previous", previous.position);
    console.log("next", next.position);

    return next;
  });
}, [sensor, width, height]);
  return motionState;
}