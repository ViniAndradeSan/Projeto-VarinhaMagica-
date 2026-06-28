# Varinha Mágica — v5 Changelog

## O que mudou em v5

### 🚫 REMOVIDO COMPLETAMENTE
- `expo-sensors` — acelerômetro, giroscópio e magnetômetro eliminados
- `src/core/sensors/` — diretório inteiro removido
- `src/constants/sensor.ts`, `motion.ts` — constantes de sensores removidas
- `src/core/math/Quaternion.ts`, `Vector3.ts` — matemática 3D desnecessária

### ✅ ADICIONADO / REFATORADO

#### Motor de Reconhecimento — `engine/dollarRecognizer.ts`
- Implementação completa do **algoritmo $1 Unistroke Recognizer** (Wobbrock et al., 2007)
- **Pipeline rigorosa**: resample(64pts) → indicativeAngle → rotate → scaleTo250 → translateCentroid → goldenSectionSearch
- **Templates canônicos** por forma: circle (64pts trigonométrico), zigzag (3 segmentos Z), triangle (equilátero 3 lados), horizontal/vertical (linha reta)
- **Validações discriminativas pré-score** por forma:
  - `circle`: winding ≥ π·0.85, closure ≤ 38%, reversals < 4
  - `zigzag`: ≥ 3 reversões horizontais, winding < π·1.2
  - `triangle`: ≥ 2 cantos agudos, closure ≤ 45%
  - `horizontal`: aspect ratio ≥ 2.2, winding < π·0.7
  - `vertical`: aspect ratio ≤ 0.45, winding < π·0.7
- **Threshold ultra-rigoroso**: MIN_RECOGNITION_SCORE = **0.72** (qualquer desvio → erro crítico)
- Resultado tipado: `{ kind: "recognized" | "failure" | "noise" }`

#### Feedback Sensorial — `services/FeedbackService.ts`
- **expo-haptics**: `notificationAsync(Success)` no cast, `notificationAsync(Error)` + `impactAsync(Heavy)` no erro, `impactAsync(Light)` em pulsos de canalização
- **expo-speech**: `Speech.speak(spellName, { pitch, rate })` invocado **imediatamente** após validação do motor — antes do efeito visual terminar
- Cada feitiço tem pitch/rate únicos para som místico diferenciado

#### Trail — `components/WandTrail.tsx`
- Migrado de `View` dots para **SVG Path** via `react-native-svg`
- Curvas de Bézier quadráticas suaves (Q command) em vez de pontos discretos
- Três camadas: halo (blur), traço principal com gradiente linear, brilho central branco

#### Painel de Concentração — `components/ConcentrationPanel.tsx`
- Anel de progresso circular via SVG `Circle` com `strokeDashoffset` animado
- Exibe porcentagem e nível de confiança do reconhecimento

#### GestureHint — `components/GestureHint.tsx`
- Ícones SVG das 5 formas renderizados via `react-native-svg`

### 📦 Dependências adicionadas
```json
"expo-haptics": "~14.1.4",
"expo-speech": "~13.1.0",
"react-native-gesture-handler": "~2.24.0",
"react-native-svg": "~15.11.2"
```

### 🏗 Arquitetura
```
src/features/wand/
├── engine/
│   ├── dollarRecognizer.ts  ← Motor $1 completo + validações discriminativas
│   └── spells.ts            ← Catálogo de feitiços com speechPitch/Rate
├── services/
│   └── FeedbackService.ts   ← Haptics (expo-haptics) + TTS (expo-speech)
├── hooks/
│   └── useWand.ts           ← Orquestrador de estado (toque → reconhecimento → feedback)
├── components/
│   ├── WandTrail.tsx        ← SVG Path com Bézier
│   ├── WandCursor.tsx       ← Animação de cursor
│   ├── ConcentrationPanel.tsx ← SVG circular progress
│   ├── SpellEffect.tsx      ← Efeito pós-conjuração
│   └── GestureHint.tsx      ← Guia SVG de formas
└── types/
    └── wandState.ts         ← Tipos TypeScript completos
```
