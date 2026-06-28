/**
 * useWand — Hook principal da Varinha Mágica v5
 * ================================================
 * Gerencia o ciclo de vida completo:
 *   idle → drawing → casting
 *                  → [failure] error → idle
 *
 * O ciclo de concentração foi removido para tornar o fluxo de uso mais ágil.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import type { TrailPoint, WandState } from "../types/wandState";
import { recognizeGesture } from "../engine/dollarRecognizer";
import {
  hapticSuccess,
  hapticCriticalError,
  hapticDrawStart,
  speakSpell,
  stopSpeech,
} from "../services/FeedbackService";
import { CAST_DISPLAY_MS, ERROR_DISPLAY_MS } from "../constants/world";
// ─── Temporizadores e durações ───────────────────────────────────────────────


const INITIAL_STATE: WandState = {
  phase: "idle",
  cursor: { x: 0, y: 0 },
  trail: [],
  spell: null, 
  frozenTrail: [],
  recognizedSpell: null,
  castEffect: null,
  lastConfidence: 0,
  timestamp: Date.now(),
};

let pointId = 0;

export function useWand() {
  const [state, setState] = useState<WandState>(INITIAL_STATE);

  const trailRef = useRef<TrailPoint[]>([]);
  const phaseRef = useRef<WandState["phase"]>("idle");

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const castTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (castTimerRef.current) clearTimeout(castTimerRef.current);
      void stopSpeech();
    };
  }, []);

  const triggerFailure = useCallback((frozenTrail: TrailPoint[]) => {
    if (castTimerRef.current) {
      clearTimeout(castTimerRef.current);
      castTimerRef.current = null;
    }
    void hapticCriticalError();
    phaseRef.current = "error";

    setState((prev) => ({
      ...prev,
      phase: "error",
      trail: [],
      spell: null, 
      frozenTrail,
      recognizedSpell: null,
      castEffect: null,
      lastConfidence: 0,
      timestamp: Date.now(),
    }));

    errorTimerRef.current = setTimeout(() => {
      phaseRef.current = "idle";
      setState((s) =>
        s.phase === "error"
          ? { ...s, phase: "idle", frozenTrail: [], timestamp: Date.now() }
          : s
      );
      errorTimerRef.current = null;
    }, ERROR_DISPLAY_MS);
  }, []);

  const triggerCast = useCallback((spell: WandState["recognizedSpell"], trail: TrailPoint[], confidence: number) => {
    if (!spell) return;

    if (castTimerRef.current) {
      clearTimeout(castTimerRef.current);
      castTimerRef.current = null;
    }

    void hapticSuccess();
    void speakSpell(spell);

    phaseRef.current = "casting";
    setState((prev) => ({
      ...prev,
      phase: "casting",
      trail: [],
      spell: spell, 
      frozenTrail: trail,
      recognizedSpell: spell,
      castEffect: spell.name,
      lastConfidence: confidence,
      timestamp: Date.now(),
    }));

    castTimerRef.current = setTimeout(() => {
      phaseRef.current = "idle";
      setState((s) => ({
        ...s,
        phase: "idle",
        trail: [],
        spell: null,
        frozenTrail: [],
        recognizedSpell: null,
        castEffect: null,
        lastConfidence: 0,
        timestamp: Date.now(),
      }));
      castTimerRef.current = null;
    }, CAST_DISPLAY_MS);
  }, []);

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;

      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      if (castTimerRef.current) {
        clearTimeout(castTimerRef.current);
        castTimerRef.current = null;
      }

      trailRef.current = [];
      phaseRef.current = "drawing";

      void hapticDrawStart();

      setState((prev) => ({
        ...prev,
        phase: "drawing",
        cursor: { x: locationX, y: locationY },
        trail: [],
        spell: null, 
        frozenTrail: [],
        recognizedSpell: null,
        castEffect: null,
        lastConfidence: 0,
        timestamp: Date.now(),
      }));
    },
    []
  );

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (phaseRef.current !== "drawing") return;

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
    },
    []
  );

  const onTouchEnd = useCallback(() => {
    if (phaseRef.current !== "drawing") return;

    const trail = trailRef.current;
    const result = recognizeGesture(trail);

    if (result.kind === "recognized") {
      triggerCast(result.spell, trail, result.confidence);
    } else if (result.kind === "failure") {
      triggerFailure(trail);
    } else {
      phaseRef.current = "idle";
      setState((prev) => ({
        ...prev,
        phase: "idle",
        trail: [],
        spell: null, 
        frozenTrail: [],
        recognizedSpell: null,
        castEffect: null,
        lastConfidence: 0,
        timestamp: Date.now(),
      }));
    }
  }, [triggerCast, triggerFailure]);

  const reset = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    if (castTimerRef.current) {
      clearTimeout(castTimerRef.current);
      castTimerRef.current = null;
    }
    void stopSpeech();
    trailRef.current = [];
    phaseRef.current = "idle";
    setState(INITIAL_STATE);
  }, []);

  return { state, onTouchStart, onTouchMove, onTouchEnd, reset };
}
