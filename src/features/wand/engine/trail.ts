import type { WandState } from "../types/wandState";

const MIN_MOVE = 0.007;
const MAX_POINTS = 24;

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// 💡 Adicionado o argumento `isMoving` separado para respeitar sua interface WandState
export function updateTrail(state: WandState, isMoving: boolean): WandState {
  const lastPoint = state.trail[state.trail.length - 1];
  
  const shouldAppend =
    isMoving &&
    (!lastPoint || distance(lastPoint, state.cursor) > MIN_MOVE);

  const trail = shouldAppend
    ? [
        ...state.trail, 
        { 
          id: state.timestamp, 
          x: state.cursor.x, 
          y: state.cursor.y, 
          timestamp: state.timestamp 
        } 
      ]
    : state.trail;

  return {
    ...state,
    trail: trail.slice(-MAX_POINTS),
  };
}
