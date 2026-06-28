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

export interface SpellDefinition {
  name: string;
  voiceCommand: string;
  color: string;
  description: string;
}

export type SpellPhase =
  | "drawing"      // usuário está desenhando
  | "recognized"   // gesto reconhecido, aguarda voz
  | "listening"    // ouvindo voz
  | "casting"      // efeito acontecendo
  | "error"        // gesto inválido (vibração + msg)
  | "idle";        // em repouso

export interface WandState {
  phase: SpellPhase;
  cursor: Vector2;
  trail: TrailPoint[];
  frozenTrail: TrailPoint[];
  recognizedSpell: SpellDefinition | null;
  castEffect: string | null;
  voiceCaption: string | null;
  voiceFeedback: string | null;
  timestamp: number;
}
