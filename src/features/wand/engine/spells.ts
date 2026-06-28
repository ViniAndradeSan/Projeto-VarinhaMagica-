import type { SpellDefinition } from "../types/wandState";

// Feitiços disponíveis com seus gestos e palavras mágicas
export const SPELLS: SpellDefinition[] = [
  {
    name: "Lumos",
    voiceCommand: "lumos",
    color: "#fffde7",
    description: "Ilumina as trevas",
  },
  {
    name: "Expelliarmus",
    voiceCommand: "expelliarmus",
    color: "#ef5350",
    description: "Desarma o adversário",
  },
  {
    name: "Alohomora",
    voiceCommand: "alohomora",
    color: "#66bb6a",
    description: "Abre fechaduras",
  },
  {
    name: "Wingardium Leviosa",
    voiceCommand: "wingardium leviosa",
    color: "#42a5f5",
    description: "Levita objetos",
  },
  {
    name: "Avada Kedavra",
    voiceCommand: "avada kedavra",
    color: "#00e676",
    description: "A maldição que não deve ser nomeada",
  },
];
