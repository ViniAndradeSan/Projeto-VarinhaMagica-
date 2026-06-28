import type { TrailPoint, WandState } from "../types/wandState";

const MIN_POINTS = 10;
const DEAD_ZONE = 0.02;
const COOLDOWN = 900;
const SPELL_DURATION = 1100;

function computeCenter(points: TrailPoint[]) {
  return points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
}

function computeWinding(points: TrailPoint[]) {
  const center = computeCenter(points);
  const cx = center.x / points.length;
  const cy = center.y / points.length;

  let lastAngle = Math.atan2(points[0].y - cy, points[0].x - cx);
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const angle = Math.atan2(point.y - cy, point.x - cx);
    let delta = angle - lastAngle;

    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    total += delta;
    lastAngle = angle;
  }

  return total;
}

function computeZigzag(points: TrailPoint[]) {
  let count = 0;
  let lastDirectionX = 0;
  let lastDirectionY = 0;

  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;

    const directionX = Math.sign(dx);
    const directionY = Math.sign(dy);

    if (directionX !== 0 && directionX !== lastDirectionX) count += 1;
    if (directionY !== 0 && directionY !== lastDirectionY) count += 1;

    if (Math.abs(dx) > DEAD_ZONE) lastDirectionX = directionX;
    if (Math.abs(dy) > DEAD_ZONE) lastDirectionY = directionY;
  }

  return count;
}

function detectGesture(trail: TrailPoint[]): string | null {
  if (trail.length < MIN_POINTS) return null;

  const points = trail.slice(-MIN_POINTS);
  const distance = Math.hypot(points[points.length - 1].x - points[0].x, points[points.length - 1].y - points[0].y);
  const totalLength = points.reduce((sum, point, index) => {
    if (index === 0) return 0;
    const previous = points[index - 1];
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);

  if (totalLength < 0.25) return null;

  const winding = computeWinding(points);
  if (Math.abs(winding) > Math.PI * 2.4 && distance < 0.28) {
    return "Círculo Mágico";
  }

  const zigzag = computeZigzag(points);
  if (zigzag >= 4 && distance > 0.18) {
    return "Risco de Fogo";
  }

  if (distance > 0.4 && totalLength > 0.6) {
    return "Vento";
  }

  return null;
}

export function updateGestures(state: WandState): WandState {
  const now = state.timestamp;
  const active = state.spell && now - state.spell.startedAt < state.spell.duration;

  if (active && state.spell) {
    const alpha = Math.max(0, 1 - (now - state.spell.startedAt) / state.spell.duration);
    return {
      ...state,
      spell: {
        ...state.spell,
        alpha,
      },
    };
  }

  const cooldownActive = state.spell && now - state.spell.startedAt < COOLDOWN;
  if (cooldownActive) {
    return {
      ...state,
      spell: null,
    };
  }

  const gestureName = detectGesture(state.trail);
  if (!gestureName) {
    return {
      ...state,
      spell: null,
    };
  }

  return {
    ...state,
    spell: {
      name: gestureName,
      alpha: 1,
      startedAt: now,
      duration: SPELL_DURATION,
    },
  };
}
