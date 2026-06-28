// ─── Tipos base ───────────────────────────────────────────────────────────────

export interface Vector2 {
  x: number;
  y: number;
}

export interface TrailPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

// ─── Definição de feitiço ─────────────────────────────────────────────────────

export type SpellShape =
  | "circle"     // Lumos      — círculo fechado
  | "zigzag"     // Expelliarmus — Z ziguezague horizontal
  | "triangle"   // Alohomora  — triângulo com 3 lados claros
  | "horizontal" // Wingardium — linha horizontal longa
  | "vertical";  // Avada       — linha vertical descendente

export interface SpellDefinition {
  name: string;
  shape: SpellShape;
  color: string;
  glowColor: string;
  description: string;
  emoji: string;
  /** Pitch de voz (0.5 = grave, 2.0 = agudo) */
  speechPitch: number;
  /** Taxa de fala (0.5 = lento, 2.0 = rápido) */
  speechRate: number;
}

export interface RecognitionDebug {
  winding: number;
  corners: number;
  reversals: number;
  closure: number;
  pathLength: number;
  horizontalRatio: number;
  verticalRatio: number;
  lineStraightness: number;
}

// ─── Resultado do reconhecedor ────────────────────────────────────────────────

export type RecognitionResult =
  | {
      kind: "recognized";
      spell: SpellDefinition;
      winner: SpellDefinition;
      confidence: number;
      ranking: ShapeScore[];
      debug: RecognitionDebug;
    }
  | {
      kind: "failure";
      confidence: number;
      ranking: ShapeScore[];
      debug: RecognitionDebug;
    }
  | {
      kind: "noise";
      confidence: number;
      ranking: ShapeScore[];
      debug: RecognitionDebug;
    };

// ─── Score por forma ──────────────────────────────────────────────────────────

export interface ShapeScore {
  shape: SpellShape;
  score: number;
}

// ─── Fase do estado da varinha ────────────────────────────────────────────────

export type SpellPhase =
  | "idle"
  | "drawing"
  | "casting"
  | "error";

// ─── Estado global da varinha ─────────────────────────────────────────────────

export interface WandState {
  phase: SpellPhase;
  cursor: Vector2;
  trail: TrailPoint[];
  frozenTrail: TrailPoint[];
  recognizedSpell: SpellDefinition | null;
  castEffect: string | null;
  /** Última confiança do reconhecedor (0–1) */
  lastConfidence: number;
  timestamp: number;
}
