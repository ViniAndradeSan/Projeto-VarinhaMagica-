import { useCallback, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import type { TrailPoint, WandState } from "../types/wandState";
import { recognizeGesture } from "../engine/gestureRecognizer";

const INITIAL_STATE: WandState = {
  phase: "idle",
  cursor: { x: 0, y: 0 },
  trail: [],
  frozenTrail: [],
  recognizedSpell: null,
  castEffect: null,
  timestamp: Date.now(),
};

let pointId = 0;

export function useWand() {
  const [state, setState] = useState<WandState>(INITIAL_STATE);
  const trailRef = useRef<TrailPoint[]>([]);

  // ── Touch handlers ────────────────────────────────────────────────────────

  const onTouchStart = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    trailRef.current = [];
    setState((prev) => ({
      ...prev,
      phase: "drawing",
      cursor: { x: locationX, y: locationY },
      trail: [],
      frozenTrail: [],
      recognizedSpell: null,
      castEffect: null,
      timestamp: Date.now(),
    }));
  }, []);

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const point: TrailPoint = {
      id: pointId++,
      x: locationX,
      y: locationY,
      timestamp: Date.now(),
    };
    trailRef.current = [...trailRef.current, point];
    setState((prev) => ({
      ...prev,
      cursor: { x: locationX, y: locationY },
      trail: trailRef.current,
      timestamp: Date.now(),
    }));
  }, []);

  const onTouchEnd = useCallback(() => {
    const trail = trailRef.current;
    const spell = recognizeGesture(trail);

    if (spell) {
      // Gesto reconhecido → congela rastro e pede a palavra mágica
      setState((prev) => ({
        ...prev,
        phase: "recognized",
        trail: [],
        frozenTrail: trail,
        recognizedSpell: spell,
        timestamp: Date.now(),
      }));
    } else {
      // Não reconhecido → volta ao idle
      setState((prev) => ({
        ...prev,
        phase: "idle",
        trail: [],
        frozenTrail: [],
        recognizedSpell: null,
        timestamp: Date.now(),
      }));
    }
  }, []);

  // ── Chamado pela tela quando o usuário diz a palavra mágica ───────────────

  const onVoiceResult = useCallback((transcript: string) => {
    setState((prev) => {
      if (!prev.recognizedSpell) return prev;

      const spoken = transcript.toLowerCase().trim();
      const expected = prev.recognizedSpell.voiceCommand.toLowerCase();
      const matched = spoken.includes(expected);

      if (matched) {
        // Tudo certo → efeito!
        const effect = prev.recognizedSpell.name;
        setTimeout(() => {
          setState((s) => ({
            ...s,
            phase: "idle",
            frozenTrail: [],
            recognizedSpell: null,
            castEffect: null,
          }));
        }, 3500);
        return {
          ...prev,
          phase: "casting",
          castEffect: effect,
          timestamp: Date.now(),
        };
      } else {
        // Palavra errada → reseta
        return {
          ...prev,
          phase: "idle",
          frozenTrail: [],
          recognizedSpell: null,
          castEffect: null,
          timestamp: Date.now(),
        };
      }
    });
  }, []);

  const startListening = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "listening" }));
  }, []);

  const reset = useCallback(() => {
    trailRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return { state, onTouchStart, onTouchMove, onTouchEnd, onVoiceResult, startListening, reset };
}
