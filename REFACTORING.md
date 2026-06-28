# Varinha Mágica — Refatoração v2

## O que mudou

### Antes (v1)
- Usava **acelerômetro + giroscópio** para mover a bolinha
- Dependência de `expo-sensors`
- Sensor fusion complexo

### Agora (v2)
- **Desenhe com o dedo** na tela
- A bolinha acompanha o toque com rastro de partículas
- Zero sensores — só toque nativo do React Native

---

## Fluxo da Magia

```
1. DESENHO
   └── Usuário desliza o dedo na tela
   └── Bolinha + rastro acompanham

2. RECONHECIMENTO
   └── Ao soltar o dedo, o algoritmo analisa o traçado
   └── Se reconhecido → rastro congela na tela com cor do feitiço

3. PALAVRA MÁGICA
   └── Painel aparece com o feitiço detectado
   └── Usuário pressiona 🎤 e diz a palavra mágica
   └── Web: usa SpeechRecognition nativa do browser
   └── Mobile: Alert.prompt como fallback (adicione @react-native-voice/voice para produção)

4. EFEITO
   └── Se gesto + voz batem → animação + partículas + nome do feitiço
   └── Tela reseta após 3.5s
```

---

## Gestos

| Gesto       | Feitiço              | Palavra Mágica        |
|-------------|----------------------|-----------------------|
| ○ Círculo   | Lumos                | "lumos"               |
| Z Ziguezague| Expelliarmus         | "expelliarmus"        |
| △ Triângulo | Alohomora            | "alohomora"           |
| → Horizontal| Wingardium Leviosa   | "wingardium leviosa"  |
| ↓ Vertical  | Avada Kedavra        | "avada kedavra"       |

---

## Arquitetura

```
src/features/wand/
├── components/
│   ├── WandCursor.tsx      — bolinha que segue o dedo
│   ├── WandTrail.tsx       — rastro ao vivo + rastro fixo
│   ├── VoicePanel.tsx      — UI de reconhecimento de voz
│   ├── SpellEffect.tsx     — efeito visual da magia
│   └── GestureHint.tsx     — guia de gestos no canto
├── engine/
│   ├── gestureRecognizer.ts — algoritmo de reconhecimento
│   └── spells.ts            — definição dos feitiços
├── hooks/
│   └── useWand.ts           — lógica principal (touch + estados)
└── types/
    └── wandState.ts         — tipos TypeScript
```

## Para produção (audio nativo no device)

Instale `@react-native-voice/voice` e substitua o `Alert.prompt` no VoicePanel pelo listener de voz nativo.
