/**
 * FeedbackService — Varinha Mágica v5.1
 * =====================================
 * Centraliza todo feedback sensorial: haptics + text-to-speech.
 * Isolado dos componentes visuais para máxima reutilização e testabilidade.
 */

import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import type { SpellDefinition } from "../types/wandState";
import { DEFAULT_LANGUAGE, delay } from "../constants/world";


// ─── Haptics ──────────────────────────────────────────────────────────────────

/**
 * Feedback tátil de SUCESSO: um impacto médio suave, confirmando o feitiço.
 */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silencia erros em simuladores sem suporte a haptics
  }
}

/**
 * Feedback tátil de ERRO CRÍTICO: impacto severo, comunicando falha da magia.
 * Usa await sequencial para evitar atropelar o motor de vibração nativo.
 */
export async function hapticCriticalError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Pequena janela de tempo para o motor físico respirar entre os pulsos
    await delay(120);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silencia
  }
}

/**
 * Pulso de canalização: impacto leve repetido enquanto o dedo está parado.
 * Chamado externamente em loop pelo hook de concentração.
 */
export async function hapticChannelPulse(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silencia
  }
}

/**
 * Feedback tátil ao iniciar o desenho (varinha ativada).
 */
export async function hapticDrawStart(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silencia
  }
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────

/**
 * Anuncia o nome do feitiço em voz alta com parâmetros místicos.
 * Protegido contra concorrência de chamadas consecutivas.
 */
export async function speakSpell(spell: SpellDefinition): Promise<void> {
  try {
    // Força a parada da fala anterior
    await Speech.stop();
    
    // Pequena folga para a API nativa liberar a thread de áudio
    await delay(50);

    await Speech.speak(spell.name, {
      language: DEFAULT_LANGUAGE,
      pitch: spell.speechPitch,
      rate: spell.speechRate,
    });
  } catch {
    // Speech pode falhar se o motor de voz do OS estiver ocupado ou em simuladores
  }
}

/**
 * Para qualquer fala em andamento de forma segura.
 */
export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // Silencia
  }
}
