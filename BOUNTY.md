# Relatório de Anomalias — Bounties

## [Nível 3] expo-haptics não dispara em simulador

**API:** `expo-haptics`

**Comportamento encontrado:**
As funções `hapticCriticalError()`, `hapticSuccess()` e `hapticDrawStart()` são chamadas corretamente,
mas não produzem nenhuma resposta tátil quando o app roda no simulador iOS ou no emulador Android.

**Causa identificada:**
Simuladores e emuladores não possuem motor de vibração físico. O hardware de haptics (Taptic Engine
no iPhone, motor de vibração no Android) simplesmente não existe na máquina virtual. A API do
expo-haptics chama a API nativa do sistema operacional, que por sua vez tenta acionar o hardware —
e falha silenciosamente porque o hardware não existe.

Por isso o `FeedbackService.ts` envolve todas as chamadas em `try/catch` que silencia os erros:
sem esse tratamento, o app quebraria no simulador.

**Como reproduzir intencionalmente:**
1. Rodar o app no simulador iOS (Expo Go ou build de desenvolvimento)
2. Desenhar um gesto válido (ex: círculo para Lumos)
3. → Nenhuma vibração acontece, mesmo com o feitiço sendo conjurado na tela
4. Rodar o mesmo app em um dispositivo físico iOS ou Android
5. Repetir o gesto
6. → Vibração dupla (notificationAsync + impactAsync Heavy) confirmada na mão

**Evidência no código:**
```ts
// FeedbackService.ts — linha 20
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silencia erros em simuladores sem suporte a haptics ← este catch existe por causa desse bug
  }
}
```

---

## [Nível 2] Reconhecimento de voz (expo-av / expo-speech Recognition) exige build nativo

**API:** `expo-av` / `expo-speech` — gravação e reconhecimento de áudio

**Contexto:**
A ideia original do projeto era permitir que o usuário *falasse* o nome do feitiço ("Lumos!",
"Expelliarmus!") para conjurá-lo, em vez de desenhar gestos. O reconhecimento de voz foi
descartado e substituído pelo motor de gestos atual exatamente por causa desta limitação.

**Comportamento encontrado:**
A API de gravação de áudio do Expo (`expo-av`) consegue capturar o microfone, mas não oferece
reconhecimento de fala (speech-to-text) nativo. Para isso seria necessário integrar a
`SpeechRecognition` API do browser (web only) ou uma lib nativa como `@react-native-voice/voice`,
que **não funciona no Expo Go** — exige build de desenvolvimento ou produção.

**Causa identificada:**
O reconhecimento de voz no React Native depende de módulos nativos compilados junto ao app:
`SFSpeechRecognizer` no iOS e `SpeechRecognizer` no Android. O Expo Go é um binário
genérico que não inclui esses módulos. Qualquer tentativa de usar `@react-native-voice/voice`
no Expo Go resulta em erro de módulo nativo não encontrado (`NativeModules.Voice is null`).

**Como reproduzir intencionalmente:**
1. Instalar `@react-native-voice/voice` no projeto
2. Tentar importar e inicializar `Voice.start('pt-BR')` rodando via Expo Go
3. → Erro: `Cannot read property 'start' of null` ou `NativeModules.Voice is null`
4. Gerar um build de desenvolvimento com `expo-dev-client`
5. Repetir a inicialização
6. → Reconhecimento funciona, retorna o texto falado via callback `onSpeechResults`

**Impacto no projeto:**
A feature de feitiço por voz foi substituída pelo motor de gestos (`dollarRecognizer.ts`),
que funciona 100% em Expo Go sem dependências nativas adicionais. A limitação foi a decisão
arquitetural que definiu o formato final do app.

---

## [Nível 2] Dimensions.get("window") não atualiza ao girar o celular

**API:** `Dimensions` (React Native core) → substituído por `useWindowDimensions`

**Comportamento encontrado:**
Ao girar o celular durante o uso do app, o SVG do trail (`WandTrail`) e o cursor (`WandCursor`)
continuam usando as dimensões originais da tela — largura e altura invertidas — causando
desenhos cortados ou posicionados fora da área visível.

**Causa identificada:**
`Dimensions.get("window")` é uma chamada estática: retorna o valor no momento em que o módulo
é carregado e nunca mais atualiza. O hook `useWindowDimensions` é a alternativa reativa que
re-renderiza o componente sempre que as dimensões mudam (rotação, janela redimensionada no iPad).

**Como reproduzir:**
1. Versão anterior do código (com `Dimensions.get` estático, fora do componente)
2. Iniciar o app em portrait
3. Girar o celular para landscape
4. Desenhar um gesto
5. → O trail é renderizado com `width` e `height` trocados, cortando o SVG

**Correção aplicada:**
```ts
// Antes (estático, fora do componente):
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Depois (reativo, dentro do componente):
const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
```