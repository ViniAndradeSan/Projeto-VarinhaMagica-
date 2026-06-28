/**
 * FeedbackService — Varinha Mágica v5
 * =====================================
 * Centraliza todo feedback sensorial: haptics + text-to-speech.
 * Isolado dos componentes visuais para máxima reutilização e testabilidade.
 */

import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import type { SpellDefinition } from "../types/wandState";

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
 */
export async function hapticCriticalError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Duplo impacto para enfatizar o erro
    await new Promise<void>((r) => setTimeout(r, 120));
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
 * Feedback tátil ao iniciar o desenho.
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
 * Chamado imediatamente após a validação do motor.
 */
export async function speakSpell(spell: SpellDefinition): Promise<void> {
  try {
    // Para qualquer fala anterior antes de iniciar a nova
    await Speech.stop();

    await Speech.speak(spell.name, {
      language: "pt-BR",
      pitch: spell.speechPitch,
      rate: spell.speechRate,
      // Pronúncia em pt-BR com os nomes latinos soa mais místico
    });
  } catch {
    // Speech pode falhar em alguns simuladores
  }
}

/**
 * Para qualquer fala em andamento.
 */
export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // Silencia
  }
}
