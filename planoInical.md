git Areas que esse projecto vai me ajudar

* APIs nativas;
* matemática aplicada;
* processamento de sinais;
* arquitetura de software;
* animações em tempo real;
* renderização gráfica;
* áudio;
* acessibilidade;
* machine learning (no futuro, se quisermos);
* desenvolvimento de jogos.

---

# Minha proposta de arquitetura


```
src/

app/                    // Expo Router

components/             // componentes reutilizáveis

features/
    sensors/
        hooks/
        services/
        types/

    gesture/
        algorithms/
        recognizers/
        templates/

    magic/
        spells/
        engine/
        effects/

    gameplay/
        enemy/
        mana/
        combat/

    audio/

    particles/

    flashlight/

    speech/

graphics/
    trail/
    shaders/
    canvas/

hooks/

store/

services/

constants/

utils/

types/

assets/
```
---

# Arquitetura Geral

```text
           Sensores
               │
               ▼
      Motion Processor
               │
               ▼
      Gesture Recognizer
               │
      gesto reconhecido
               │
               ▼
         Magic Engine
          │        │
          │        │
      Voice Match  │
          │        │
          └────────┘
               │
               ▼
        Spell Executed
      ┌──────┼────────┐
      ▼      ▼        ▼
   Áudio   Haptics  Partículas
                    Lanterna
                    Gameplay
```

Perceba que cada bloco tem apenas uma responsabilidade.

Isso segue o princípio de responsabilidade única.

---

# A grande diferença deste projeto

A maioria dos outros aplicativos
```
Botão

↓

Evento

↓

Tela
```

O Projecto que está lendo
```
Acelerômetro

↓

Filtro

↓

Integração

↓

Trajetória

↓

Normalização

↓

Reconhecimento

↓

Magia

↓

Sistema de efeitos
```

---

Pensamento para casa fase
## Fase 0 

Objetivo:

* criar projeto
* configurar Expo Router
* TypeScript
* ESLint
* Prettier
* aliases
* estrutura de pastas
* Zustand
* tema
* componentes base

---

## Fase 1 


Objetivo:
```
Acelerômetro

↓

Giroscópio

↓

Fusion

↓

Posição estimada

↓

Desenho da trilha
```

---

## Fase 2- 

Utilizar o React Native Skia


Porque:

* renderiza no pipeline gráfico;
* excelente desempenho;
* animações suaves;
* partículas;
* brilho;
* blur;
* shaders;
* curvas;
* filtros.

Mais tarde ela servirá para:

* partículas
* fogo
* água
* escudos
* explosões


---

# Fase 3


```
Sensores

↓

Velocidade

↓

Orientação

↓

Trajetória

↓

Lista de pontos

↓

Normalização

↓

Comparação

↓

Gesto reconhecido
```

---

# Matemática envolvida

Assuntos aplicados

## Vetores

```
A -----> B
```

---

## Distância Euclidiana

```
d = √((x2-x1)²+(y2-y1)²)
```

---

## Produto Escalar

Para saber direção.

---

## Ângulo

Para saber mudança de direção.

---

## Interpolação

Para deixar todos os gestos com o mesmo número de pontos.

---

## Reamostragem

Muito usada em reconhecimento de escrita.

---

## Normalização

Todos os gestos passam a ter:

* mesma escala
* mesma posição
* mesmo número de pontos

Independentemente de quem desenhou.

---

# Algoritmo de reconhecimento

Recognizer
```
Gesto desenhado

↓

Reamostrar

↓

Escalar

↓

Centralizar

↓

Comparar

↓

Score

↓

Melhor candidato
```

---

# Sistema de Magias

Ao invez de varios "IFs", usaremos POO

Criaria um motor de magias.

```text
MagicEngine

↓

Spell

↓

Effect

↓

Renderer
```

Cada magia seria apenas um objeto:

```ts
{
    name: "Lumos",

    gesture: "circle",

    voice: "lumos",

    mana: 15,

    effects: [
        Flashlight,
        GlowParticles,
        Sound
    ]
}
```

Isso permite adicionar novas magias sem alterar a lógica principal.

---

# Gameplay

Teremos algo como

```text
Enemy

↓

State Machine

↓

Idle

Attack

Recover

Dead
```

Máquinas de estados deixam o comportamento previsível e fácil de expandir.

---