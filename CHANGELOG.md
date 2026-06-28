# Varinha Mágica — v4 Changelog

## Correções críticas

### 🔴 Arquivos vazios preenchidos
- `src/core/math/Vector2.ts`, `Vector3.ts`, `Quaternion.ts` — implementados com helpers básicos
- `src/core/sensors/services/AccelerometerService.ts`, `GyroscopeService.ts`, `SensorFusionService.ts` — stubs documentados
- `src/features/wand/services/SpellEngine.ts`, `GestureRecognizer.ts` — stubs documentados

### 🔴 Vazamento de memória no SpellEffect corrigido
- `SparkParticle`: `Math.random()` movido para `useRef` — valores estáveis entre renders
- Todas animações em loop agora retornam cleanup no `useEffect`

### 🔴 isActiveRef/isReadyRef no VoicePanel — estado limpo ao desmontar
- `useEffect` de cleanup reseta todos os refs ao desmontar o componente
- Lógica de `hasStartedRef` evita duplo disparo de reconhecimento

### 🔴 setTimeout sem cleanup no useWand — corrigido
- `errorTimerRef`, `castTimerRef`, `voiceAutoTimerRef` guardam referências
- `useEffect` de cleanup cancela todos os timers no unmount
- Timers cancelados ao iniciar novo gesto

## Sistema de áudio — principal melhoria

### ⏱ Timeout de 5 segundos no reconhecimento de voz
- O WebView agora tem um `setTimeout` de 5200ms que chama `rec.stop()` automaticamente
- Envia evento `"timeout"` se não houver resultado final antes do timeout
- `rec.continuous = false` garante sessão única por ativação
- Novo evento `"started"` confirma que o reconhecimento começou de fato

### 🎙 Barra de progresso visual
- `VoiceProgressBar` anima de 100% → 0% em exatamente `VOICE_TIMEOUT_MS` (5s)
- Feedback visual claro de quanto tempo resta para falar

### ⚡ Auto-start da escuta após 700ms
- Ao reconhecer o gesto, o listening inicia automaticamente após 700ms
- Elimina a necessidade de apertar o botão 🎤 manualmente
- Botão mantido como fallback para reiniciar a escuta

### 📱 Feedback de dispositivo não suportado (iOS WKWebView)
- Novo estado `voiceUnsupported` no `WandState`
- Aviso visível no HUD quando Web Speech API não está disponível
- Callback `onUnsupported` passado do `VoicePanel` para o `useWand`

## Melhorias de UX

### 📐 Safe Area Insets
- HUD usa `useSafeAreaInsets()` ao invés de `top: 52` hardcoded
- `SafeAreaProvider` adicionado ao `_layout.tsx` via `Providers`

### 💫 Feedback háptico no gesto reconhecido
- `Vibration.vibrate(40)` ao reconhecer gesto com sucesso (antes só havia no erro)

### 🎨 GestureHint com fade animado
- Componente recebe prop `visible` e faz fade in/out suave (300ms)
- Shapes dos gestos agora têm a cor do feitiço correspondente

### 🔵 Toque durante "casting" permitido
- `onStartShouldSetResponder` agora inclui `phase === "casting"`
- Usuário pode iniciar novo gesto sem esperar o efeito terminar

### 📊 Limite de pontos no WandTrail
- `MAX_RENDER_POINTS = 60` evita renderizar centenas de Views
- Mantém fluidez mesmo em traços longos

### ✨ Emoji nos feitiços
- `SpellDefinition` tem campo `emoji`
- Exibido no `VoicePanel` e no `SpellEffect` para identidade visual
