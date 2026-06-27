import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useAccelerometer } from "./useAccelerometer";
import { createInitialMotionState, simulateMotion } from "../services/MotionService";
import { MotionState } from "../types/motion";

export function useMotion(): MotionState {
	const sensor = useAccelerometer();
	const { width, height } = useWindowDimensions();

	const [motionState, setMotionState] = useState<MotionState>(() =>
		createInitialMotionState(width, height)
	);

	useEffect(() => {
		setMotionState((previous) => simulateMotion(previous, sensor));
	}, [sensor]);

	return motionState;
}

