import { useEffect, useMemo, useRef, useState } from "react";
import { Gyroscope } from "expo-sensors";
import { WandController } from "../controllers/wandController";
import type { WandState } from "../types/wandState";
import type { SensorFrame } from "@/core/sensors/types/SensorFrame";

const INITIAL_STATE: WandState = {
  orientation: { pitch: 0, roll: 0, yaw: 0 },
  cursor: { x: 0.5, y: 0.5 },
  velocity: { x: 0, y: 0 },
  speed: 0,
  isMoving: false,
  trail: [],
  timestamp: Date.now(),
  spell: null,
};

export function useWand(): WandState {
  const controllerRef = useRef<WandController | null>(null);
  const [state, setState] = useState<WandState>(INITIAL_STATE);

  const controller = useMemo(() => {
    if (!controllerRef.current) {
      controllerRef.current = new WandController(INITIAL_STATE);
    }
    return controllerRef.current;
  }, []);

  useEffect(() => {
    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener((data) => {
      const frame: SensorFrame = {
        accelerometer: null,
        gyroscope: {
          x: data.x,
          y: data.y,
          z: data.z,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };

      controller.tick(frame);
      setState(controller.getState());
    });

    return () => subscription.remove();
  }, [controller]);

  return state;
}
