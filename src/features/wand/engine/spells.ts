import type { SpellDefinition } from "../types/wandState";

/**
 * Catálogo canônico de feitiços.
 * Cada feitiço mapeia para uma forma geométrica reconhecida pelo motor $1.
 */
export const SPELLS: SpellDefinition[] = [
  {
    name: "Lumos",
    shape: "circle",
    color: "#fff9c4",
    glowColor: "#ffee58",
    description: "Lanterna é para aqueles que não têm varinha, mas a varinha é para aqueles que têm feitiço.",
    speechPitch: 1.4,
    speechRate: 0.85,
  },
  {
    name: "Expelliarmus",
    shape: "zigzag",
    color: "#ef5350",
    glowColor: "#ff1744",
    description: "Desarma o adversário",
    speechPitch: 0.75,
    speechRate: 0.7,
  },
  {
    name: "Alohomora",
    shape: "triangle",
    color: "#66bb6a",
    glowColor: "#00e676",
    description: "Abre fechaduras",
    speechPitch: 1.1,
    speechRate: 0.78,
  },
  {
    name: "Wiiingardium Leviosá",
    shape: "horizontal",
    color: "#42a5f5",
    glowColor: "#40c4ff",
    description: "Levita objetos, é leviosa, não leviosá",
    speechPitch: 1.25,
    speechRate: 0.72,
  },
  {
    name: "Aaa va da Ke davra",
    shape: "vertical",
    color: "#69f0ae",
    glowColor: "#00e676",
    description: "A Maldição da Morte",
    speechPitch: 0.65,
    speechRate: 0.5,
  },
];

export const SPELL_BY_SHAPE = Object.fromEntries(
  SPELLS.map((s) => [s.shape, s])
) as Record<string, SpellDefinition>;
