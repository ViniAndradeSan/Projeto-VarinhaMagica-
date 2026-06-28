import { useCallback, useRef, useState } from "react";
import { Vibration } from "react-native";
import type { GestureResponderEvent } from "react-native";
import type { TrailPoint, WandState } from "../types/wandState";
import { recognizeGesture } from "../engine/gestureRecognizer";

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
    }
  }

  return matrix[b.length][a.length];
}

function isCloseMatch(expected: string, spoken: string) {
  const a = normalizeText(expected);
  const b = normalizeText(spoken);

  if (!b) return false;
  if (b.includes(a) || a.includes(b)) return true;

  const expectedWords = a.split(/\s+/).filter(Boolean);
  const spokenWords = b.split(/\s+/).filter(Boolean);

  for (const ew of expectedWords) {
    for (const sw of spokenWords) {
      if (sw.includes(ew) || ew.includes(sw)) return true;
      if (levenshteinDistance(ew, sw) <= 1) return true;
    }
  }

  const distance = levenshteinDistance(a, b);
  return distance <= Math.max(2, Math.floor(Math.max(a.length, b.length) / 4));
}

const INITIAL_STATE: WandState = {
  phase: "idle",
  cursor: { x: 0, y: 0 },
  trail: [],
  frozenTrail: [],
  recognizedSpell: null,
  castEffect: null,
  voiceCaption: null,
  voiceFeedback: null,
  timestamp: Date.now(),
};

// Padrão de vibração para gesto errado: dois pulsos curtos
const ERROR_VIBRATION = [0, 80, 60, 80];

let pointId = 0;

export function useWand() {
  const [state, setState] = useState<WandState>(INITIAL_STATE);
  const trailRef = useRef<TrailPoint[]>([]);

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
      voiceFeedback: null,
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
    const result = recognizeGesture(trail);

    if (result === "error") {
      // Gesto real, mas forma não reconhecida → vibra + mostra erro
      Vibration.vibrate(ERROR_VIBRATION);
      setState((prev) => ({
        ...prev,
        phase: "error",
        trail: [],
        frozenTrail: trail, // mantém rastro visível em vermelho
        recognizedSpell: null,
        castEffect: null,
        voiceCaption: null,
        voiceFeedback: null,
        timestamp: Date.now(),
      }));
      // Volta ao idle após 1.4s
      setTimeout(() => {
        setState((s) =>
          s.phase === "error"
            ? { ...s, phase: "idle", frozenTrail: [], timestamp: Date.now() }
            : s
        );
      }, 1400);
    } else if (result !== null) {
      // Gesto reconhecido → aguarda palavra mágica
      setState((prev) => ({
        ...prev,
        phase: "recognized",
        trail: [],
        frozenTrail: trail,
        recognizedSpell: result,
        voiceCaption: null,
        voiceFeedback: null,
        timestamp: Date.now(),
      }));
    } else {
      // Ruído/traço muito pequeno → ignora silencioso
      setState((prev) => ({
        ...prev,
        phase: "idle",
        trail: [],
        frozenTrail: [],
        recognizedSpell: null,
        castEffect: null,
        voiceCaption: null,
        voiceFeedback: null,
        timestamp: Date.now(),
      }));
    }
  }, []);

  const onVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    setState((prev) => {
      if (!prev.recognizedSpell) return prev;

      const spoken = transcript.toLowerCase().trim();
      const expected = prev.recognizedSpell.voiceCommand.toLowerCase();
      const caption = transcript
        ? `"${transcript}"`
        : "Nenhum áudio capturado.";

      if (!isFinal) {
        return {
          ...prev,
          voiceCaption: caption,
          timestamp: Date.now(),
        };
      }

      const matched = isCloseMatch(expected, spoken);
      const feedback = transcript
        ? matched
          ? `Áudio reconhecido: "${transcript}"`
          : `Áudio ouvido: "${transcript}" — esperado "${prev.recognizedSpell.voiceCommand}"`
        : "Áudio não reconhecido. Tente novamente.";

      console.log("[VoiceResult]", { transcript, expected, matched, feedback });

      if (matched) {
        const effect = prev.recognizedSpell.name;
        setTimeout(() => {
          setState((s) => ({
            ...s,
            phase: "idle",
            frozenTrail: [],
            recognizedSpell: null,
            castEffect: null,
            voiceCaption: null,
            voiceFeedback: null,
          }));
        }, 3500);
        return {
          ...prev,
          phase: "casting",
          castEffect: effect,
          voiceCaption: caption,
          voiceFeedback: feedback,
          timestamp: Date.now(),
        };
      }

      Vibration.vibrate(120);
      return {
        ...prev,
        phase: "idle",
        frozenTrail: [],
        recognizedSpell: null,
        castEffect: null,
        voiceCaption: feedback,
        voiceFeedback: feedback,
        timestamp: Date.now(),
      };
    });
  }, []);

  const startListening = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "listening",
      voiceCaption: null,
      voiceFeedback: null,
    }));
  }, []);

  const reset = useCallback(() => {
    trailRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return { state, onTouchStart, onTouchMove, onTouchEnd, onVoiceResult, startListening, reset };
}
