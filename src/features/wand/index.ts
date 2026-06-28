// Public API of the wand feature
export { useWand } from "./hooks/useWand";
export { WandCursor } from "./components/WandCursor";
export { WandTrail } from "./components/WandTrail";
export { SpellEffect } from "./components/SpellEffect";
export { ConcentrationPanel } from "./components/ConcentrationPanel";
export { GestureHint } from "./components/GestureHint";
export { recognizeGesture, scoreAllShapes } from "./engine/dollarRecognizer";
export { SPELLS, SPELL_BY_SHAPE } from "./engine/spells";
export type { WandState, SpellDefinition, TrailPoint, SpellPhase, RecognitionResult } from "./types/wandState";
