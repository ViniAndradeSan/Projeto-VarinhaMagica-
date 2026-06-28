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
  voiceCommand: string; // palavra mágica esperada
  color: string;
  description: string;
}

export type SpellPhase =
  | "drawing"       // usuário está desenhando
  | "recognized"    // gesto reconhecido, aguarda voz
  | "listening"     // gravando voz
  | "casting"       // efeito acontecendo
  | "idle";         // em repouso

export interface WandState {
  phase: SpellPhase;
  cursor: Vector2;
  trail: TrailPoint[];
  frozenTrail: TrailPoint[];   // rastro fixo após reconhecimento
  recognizedSpell: SpellDefinition | null;
  castEffect: string | null;   // efeito visual ativo
  timestamp: number;
}
