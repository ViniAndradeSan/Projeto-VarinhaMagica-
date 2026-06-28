# Varinha Mágica

App React Native com Expo que reconhece gestos desenhados na tela e conjura feitiços de Harry Potter com feedback visual, tátil e de voz.

---

## Fluxo de Estados

O app vive em um ciclo de 4 fases controladas pelo hook `useWand`:

```
idle → drawing → casting → idle
                → error  → idle
```

| Fase | O que acontece |
|---|---|
| `idle` | Tela escura, dica de gestos visível, status bar em `auto` |
| `drawing` | Dedo na tela, rastro SVG sendo desenhado em tempo real |
| `casting` | Gesto reconhecido, efeito visual + haptic + voz disparados |
| `error` | Gesto não reconhecido, rastro fica vermelho com animação de shake |

---

## Arquitetura

```
src/
├── app/
│   └── index.tsx          # Tela principal — captura de toque + composição visual
│
└── features/wand/
    ├── hooks/
    │   └── useWand.ts         # Cérebro do app — gerencia estado e ciclo de vida
    ├── engine/
    │   ├── gestureRecognizer.ts  # Motor de reconhecimento — heurísticas geométricas
    │   ├── dollarRecognizer.ts   # Motor alternativo — algoritmo $1 com templates
    │   ├── spells.ts             # Catálogo de feitiços
    │   └── trail.ts              # Utilitário de atualização do rastro
    ├── services/
    │   └── FeedbackService.ts    # Haptics + Text-to-Speech
    ├── components/
    │   ├── WandTrail.tsx         # Rastro SVG com curvas de Bézier
    │   ├── WandCursor.tsx        # Ponto luminoso que segue o dedo
    │   ├── SpellEffect.tsx       # Anéis + partículas + card do feitiço
    │   └── GestureHint.tsx       # Dica de gestos na tela idle
    └── types/
        └── wandState.ts          # Tipos TypeScript do projeto
```

---

## Como o Reconhecimento Funciona

O motor central fica em `gestureRecognizer.ts`. Quando o usuário levanta o dedo, o array de pontos do trail passa por 4 etapas:

### 1. Resample
O trail bruto tem pontos irregulares (dependem da velocidade do dedo). O resample redistribui 64 pontos com espaçamento uniforme ao longo do caminho, tornando o reconhecimento independente da velocidade do gesto.

### 2. Normalização
Os pontos são escalados para um espaço 0–1, eliminando diferença de tamanho. Um círculo pequeno e um círculo grande viram a mesma coisa para o motor.

### 3. Extração de Features
O motor calcula 5 métricas geométricas do traço normalizado:

| Feature | O que mede |
|---|---|
| **Winding** | Quanto o traço "gira" ao redor do seu centro — alto em círculos |
| **Closure** | Distância entre o primeiro e último ponto — baixa em formas fechadas |
| **Zigzag Reversals** | Quantas vezes o traço inverte direção horizontal — alto em Z |
| **Sharp Corners** | Cantos bruscos detectados pelo ângulo entre segmentos — alto em triângulos |
| **Path Length** | Comprimento total normalizado — diferencia linhas curtas de formas complexas |

### 4. Score por Forma
Cada forma recebe um score 0–1 calculado por combinação ponderada das features:

```
Círculo      → winding alto + fechamento + traço longo
Ziguezague   → muitas inversões X + eixo horizontal dominante
Linha horiz  → dx >> dy + traço direto (pouco winding)
Linha vert   → dy >> dx + direção para baixo + traço direto
Triângulo    → cantos nítidos + traço longo
```

### 5. Decisão Final

```
score ≥ 0.52  → feitiço reconhecido (casting)
score ≥ 0.28  → forma real mas incerta → erro (vibração dupla)
score < 0.28  → ruído/rabisco aleatório → ignora silencioso
```

---

## Feitiços Disponíveis

| Gesto | Feitiço | Efeito |
|---|---|---|
| ⭕ Círculo | **Lumos** | Luz amarela |
| ⚡ Ziguezague | **Expelliarmus** | Vermelho — desarma |
| △ Triângulo | **Alohomora** | Verde — abre fechaduras |
| → Linha horizontal | **Wingardium Leviosa** | Azul — levitação |
| ↓ Linha vertical | **Avada Kedavra** | Verde escuro — maldição |

---

## Feedback Sensorial

Centralizado no `FeedbackService.ts` com justificativa por escolha:

| Evento | Haptic | Justificativa |
|---|---|---|
| Início do desenho | `selectionAsync()` | Toque leve — varinha "ativada" |
| Feitiço conjurado | `notificationAsync(Success)` | Confirmação clara de sucesso |
| Gesto não reconhecido | `notificationAsync(Error)` + `impactAsync(Heavy)` | Duplo impacto — ênfase na falha da magia |
| Pulso de concentração | `impactAsync(Light)` | Ritmo suave enquanto canaliza |

A voz anuncia o nome do feitiço via `expo-speech` com `pitch` e `rate` individuais por feitiço (Avada Kedavra tem voz grave e lenta; Lumos tem voz aguda e rápida).

---

## APIs Utilizadas

| API | Missão | Instalação |
|---|---|---|
| `expo-status-bar` | Status bar muda de estilo por fase do app | incluída no Expo |
| `Platform` (RN core) | Card do feitiço usa `shadow*` no iOS e `elevation` no Android | incluída no RN |
| `expo-haptics` | Feedback tátil distinto por tipo de evento | `npx expo install expo-haptics` |
| `useWindowDimensions` | Layout responsivo que reage à rotação de tela | incluída no RN |

---

## Limitações Conhecidas (Bounties)

**expo-haptics não dispara em simulador** — simuladores não possuem motor de vibração físico. O `FeedbackService.ts` envolve todas as chamadas em `try/catch` por isso. Funciona normalmente em dispositivo físico.

**Reconhecimento de voz exige build nativo** — a ideia original era o usuário *falar* o nome do feitiço para conjurá-lo. A lib `@react-native-voice/voice` depende de `SFSpeechRecognizer` (iOS) e `SpeechRecognizer` (Android) compilados no binário — o Expo Go não inclui esses módulos (`NativeModules.Voice is null`). Por isso o reconhecimento por gestos foi adotado no lugar.

**`Dimensions.get` não reage à rotação** — versão anterior usava `Dimensions.get("window")` estático fora do componente. Substituído por `useWindowDimensions` dentro do componente, que re-renderiza automaticamente quando a tela gira.

---

## Como Rodar

```bash
npm install
npx expo start
```

Abrir no Expo Go (iOS ou Android) ou em um emulador. Para haptics e voz funcionarem completamente, usar dispositivo físico.
