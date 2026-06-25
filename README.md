# Vero API — Documentação Técnica

> API REST construída com **Fastify**, **TypeScript**, **Prisma** e **PostgreSQL**, seguindo **Clean Architecture** e **DDD**. Possui um **core genérico reutilizável** e uma **instância concreta** para escritórios de advocacia.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitetura: Core vs. Instância](#-arquitetura-core-vs-instância)
  - [O Core — Pontos Fixos](#o-core--pontos-fixos)
  - [A Instância — Pontos Variáveis](#a-instância--pontos-variáveis)
  - [O Contrato: InstanceConfig](#o-contrato-instanceconfig)
- [Fluxo de uma Mensagem WhatsApp](#-fluxo-de-uma-mensagem-whatsapp)
- [Como a Instância Implementa o Core](#-como-a-instância-implementa-o-core)
  - [1. workspaceLabel](#1-workspacelabel)
  - [2. agents](#2-agents)
  - [3. terminalStatuses](#3-terminalstatuses)
  - [4. statusHandlers](#4-statushandlers)
  - [5. onStatusTransition](#5-onstatustransition)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Modelos de Dados](#-modelos-de-dados)
- [Camadas da Aplicação](#-camadas-da-aplicação)
- [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Autenticação](#-autenticação)

---

## 🎯 Visão Geral

A **Vero API** é dividida em duas grandes partes:

| Parte | Localização | Responsabilidade |
|---|---|---|
| **Core** | `src/core/` | Orquestração genérica de triagem via IA. Desconhece o domínio de negócio. |
| **Instância** | `src/instance/` + `src/http/` | Implementação concreta para advocacia: agentes Gemini com prompts jurídicos, status do fluxo jurídico, análise de caso, etc. |

A separação garante que o mesmo core possa ser reutilizado para outros domínios (clínicas médicas, construtoras, etc.) trocando apenas a camada de instância.

---

## 💻 Stack Tecnológico

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Fastify** | ^5.8.4 | Framework web HTTP |
| **TypeScript** | ^6.0.2 | Tipagem estática |
| **Prisma** | ^7.7.0 | ORM para acesso a dados |
| **PostgreSQL** | — | Banco de dados relacional |
| **Zod** | ^4.3.6 | Validação de dados e schemas |
| **Argon2** | ^0.44.0 | Hashing de senhas |
| **JWT** | via `@fastify/jwt` | Autenticação |
| **Redis** | via `ioredis` | Memória de chat dos agentes de IA |
| **Google Gemini** | `@google/genai` | Modelo de linguagem dos agentes de IA |
| **Evolution API** | Webhook externo | Gateway de WhatsApp |
| **Vitest** | ^4.1.4 | Testes unitários |
| **Biome** | — | Lint e formatação |

---

## 🏗️ Arquitetura: Core vs. Instância

O projeto aplica o padrão **Ports & Adapters (Hexagonal Architecture)**: o core define interfaces (`Ports`) e a instância fornece implementações (`Adapters`).

```
┌──────────────────────────────────────────────────────────────────┐
│                          CORE (Fixo)                             │
│                                                                  │
│  Controllers HTTP  ──►  Use Cases  ──►  Repositories (Prisma)   │
│                             │                                    │
│                    Orchestrator (fixo)                           │
│                    ├── HandleIncomingMessage                     │
│                    └── RouteMessage  ◄── StatusHandlerMap        │
│                                              ▲                   │
│           Ports (interfaces):                │                   │
│           IdentifierAgent                    │                   │
│           InterviewerAgent                   │                   │
│           ChatMemoryPort                     │                   │
│           InstanceConfig ────────────────────┘                   │
└───────────────────────────────────┬─────────────────────────────┘
                                    │ implementa
┌───────────────────────────────────▼─────────────────────────────┐
│                       INSTÂNCIA (Variável)                      │
│                                                                  │
│  GeminiIdentifierAgent    GeminiInterviewerAgent                 │
│  GeminiCaseAnalyzerAgent                                         │
│  Prompts jurídicos (identifier, interviewer, case-analyzer)      │
│  LAW_FIRM_STATUS (IDENTIFYING, INTERVIEWING, FORWARDED, ...)     │
│  statusHandlers (lógica por status)                              │
│  onStatusTransition (hooks pós-transição)                        │
│                                                                  │
│  Entidades extras: Lawyer, Client, Calendar                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📐 Diagrama de Classes do Framework

> **Legenda de cores:**
> - 🔵 `<<interface>>` / `<<type>>` — **Ponto flexível do core** (deve ser implementado pela instância)
> - ⚪ Classes concretas do core — comportamento fixo
> - 🟢 Classes concretas da instância — implementações do domínio de negócio

```mermaid
classDiagram
    direction TB

    %% ─────────────────────────────────────────
    %% PONTO FLEXÍVEL CENTRAL
    %% ─────────────────────────────────────────
    class InstanceConfig {
        <<interface>>
        +workspaceLabel String
        +agents AgentSet
        +terminalStatuses String[]
        +statusHandlers StatusHandlerMap
        +onStatusTransition StatusTransitionMap
    }

    %% ─────────────────────────────────────────
    %% PORTS — Pontos Flexíveis de Agente
    %% ─────────────────────────────────────────
    class IdentifierAgent {
        <<interface>>
        +identify(input) Either
    }

    class InterviewerAgent {
        <<interface>>
        +interview(input) Either
    }

    class ChatMemoryPort {
        <<interface>>
        +getHistory(key) ChatMessage[]
        +saveHistory(key, messages) void
        +clear(key) void
    }

    %% ─────────────────────────────────────────
    %% TYPES — Pontos Flexíveis de Handler
    %% ─────────────────────────────────────────
    class StatusHandlerMap {
        <<type>>
        +handlers Record
    }

    class StatusTransitionMap {
        <<type>>
        +hooks Record
    }

    class StatusHandler {
        <<type>>
        +call(session, message, ctx) Either
    }

    class StatusTransitionHandler {
        <<type>>
        +call(ctx) void
    }

    %% ─────────────────────────────────────────
    %% CORE — Fixo
    %% ─────────────────────────────────────────
    class HandleIncomingMessageUseCase {
        -terminalStatuses String[]
        +execute(request) Either
    }

    class RouteMessageUseCase {
        -statusHandlers StatusHandlerMap
        +execute(request) Either
    }

    class ProcessMessageIdentifyingAgentUseCase {
        -identifierAgent IdentifierAgent
        -chatMemory ChatMemoryPort
        -workspaceLabel String
        -onStatusTransition StatusTransitionMap
        +execute(request) Either
    }

    class ProcessInterviewInterviewerAgentUseCase {
        -interviewerAgent InterviewerAgent
        -chatMemory ChatMemoryPort
        -onStatusTransition StatusTransitionMap
        +execute(request) Either
    }

    class EvolutionWebhookController {
        +post(path, handler) void
    }

    %% ─────────────────────────────────────────
    %% INSTÂNCIA — Variável (Advocacia)
    %% ─────────────────────────────────────────
    class lawFirmInstanceConfig {
        +workspaceLabel String
        +agents AgentSet
        +terminalStatuses String[]
        +statusHandlers StatusHandlerMap
        +onStatusTransition StatusTransitionMap
    }

    class GeminiIdentifierAgent {
        -model String
        +identify(input) Either
    }

    class GeminiInterviewerAgent {
        -model String
        +interview(input) Either
    }

    class RedisChatMemoryProvider {
        +getHistory(key) ChatMessage[]
        +saveHistory(key, messages) void
        +clear(key) void
    }

    class ProcessScreeningAnalyzerAgentUseCase {
        -caseAnalyzerAgent GeminiCaseAnalyzerAgent
        +execute(ctx) void
    }

    class GeminiCaseAnalyzerAgent {
        -model String
        +analyze(input) Either
    }

    %% RELACOES Core usa Ports
    InstanceConfig --> IdentifierAgent : agents.identifier
    InstanceConfig --> InterviewerAgent : agents.interviewer
    InstanceConfig --> StatusHandlerMap : statusHandlers
    InstanceConfig --> StatusTransitionMap : onStatusTransition

    StatusHandlerMap --> StatusHandler : values
    StatusTransitionMap --> StatusTransitionHandler : values

    HandleIncomingMessageUseCase ..> InstanceConfig : terminalStatuses
    RouteMessageUseCase ..> StatusHandlerMap : delega por status
    ProcessMessageIdentifyingAgentUseCase ..> IdentifierAgent : usa
    ProcessMessageIdentifyingAgentUseCase ..> ChatMemoryPort : usa
    ProcessMessageIdentifyingAgentUseCase ..> StatusTransitionMap : dispara hook
    ProcessInterviewInterviewerAgentUseCase ..> InterviewerAgent : usa
    ProcessInterviewInterviewerAgentUseCase ..> ChatMemoryPort : usa
    ProcessInterviewInterviewerAgentUseCase ..> StatusTransitionMap : dispara hook

    EvolutionWebhookController ..> InstanceConfig : injeta config
    EvolutionWebhookController ..> HandleIncomingMessageUseCase : orquestra
    EvolutionWebhookController ..> RouteMessageUseCase : orquestra

    %% RELACOES Instancia implementa Ports
    lawFirmInstanceConfig ..|> InstanceConfig : implements
    GeminiIdentifierAgent ..|> IdentifierAgent : implements
    GeminiInterviewerAgent ..|> InterviewerAgent : implements
    RedisChatMemoryProvider ..|> ChatMemoryPort : implements

    lawFirmInstanceConfig --> GeminiIdentifierAgent : cria
    lawFirmInstanceConfig --> GeminiInterviewerAgent : cria
    lawFirmInstanceConfig --> ProcessScreeningAnalyzerAgentUseCase : hook FORWARDED
    ProcessScreeningAnalyzerAgentUseCase --> GeminiCaseAnalyzerAgent : usa
```

### Leitura do Diagrama

| Elemento | Tipo | Papel |
|---|---|---|
| `InstanceConfig` | `<<interface>>` — **ponto flexível** | Único contrato entre core e instância. Tudo que muda entre domínios passa por aqui. |
| `IdentifierAgent` | `<<interface>>` — **ponto flexível** | Define o contrato do agente que identifica o lead e a categoria do caso. |
| `InterviewerAgent` | `<<interface>>` — **ponto flexível** | Define o contrato do agente que conduz a entrevista de triagem. |
| `ChatMemoryPort` | `<<interface>>` — **ponto flexível** | Define como o histórico de chat é armazenado (Redis, in-memory, etc.). |
| `StatusHandlerMap` | `<<type>>` — **ponto flexível** | Mapa dinâmico de status → handler. A instância define quantos e quais status existem. |
| `StatusTransitionMap` | `<<type>>` — **ponto flexível** | Mapa de novo-status → hook. A instância reage a transições de estado sem alterar o core. |
| `RouteMessageUseCase` | Classe concreta do **core** | Faz lookup no `StatusHandlerMap` sem conhecer nenhum status. Completamente genérico. |
| `HandleIncomingMessageUseCase` | Classe concreta do **core** | Gerencia sessão e lead usando `terminalStatuses` da instância. |
| `ProcessMessageIdentifyingAgentUseCase` | Classe concreta do **core** | Orquestra a fase de identificação usando `IdentifierAgent` (injetado). |
| `ProcessInterviewInterviewerAgentUseCase` | Classe concreta do **core** | Orquestra a entrevista usando `InterviewerAgent` (injetado). |
| `GeminiIdentifierAgent` | Classe concreta da **instância** | Implementa `IdentifierAgent` com Gemini + prompt jurídico. |
| `GeminiInterviewerAgent` | Classe concreta da **instância** | Implementa `InterviewerAgent` com Gemini + prompt de triagem jurídica. |
| `RedisChatMemoryProvider` | Classe concreta do **core/provider** | Implementa `ChatMemoryPort` usando Redis. |
| `lawFirmInstanceConfig` | Objeto concreto da **instância** | Implementa `InstanceConfig` com todos os valores para advocacia. |
| `ProcessScreeningAnalyzerAgentUseCase` | Classe concreta da **instância** | Use case extra registrado como hook `onStatusTransition["FORWARDED"]`. |

---

### O Core — Pontos Fixos

O core é o coração da aplicação e **não pode ser modificado** para adaptar a diferentes domínios de negócio. Ele contém:

#### Entidades do domínio genérico
- **`AiSession`** — sessão de conversa WhatsApp de um lead com o bot. Armazena status (string livre), chatId, dados coletados (`chatState`) e referência ao fluxo de triagem.
- **`ScreeningFlow`** — roteiro de perguntas configurável via API. Cada fluxo tem `caseType` e um mapa JSON de `questions`.
- **`Lead`** — pessoa que entrou em contato.
- **`Workspace`** — escritório/clínica/empresa que usa o sistema.
- **`ScreeningReport`** — relatório genérico pós-triagem. O campo `data` é JSON livre, definido por cada instância.

#### Use Cases genéricos do Orchestrator
| Use Case | Responsabilidade |
|---|---|
| `HandleIncomingMessageUseCase` | Gerencia sessão: cria nova sessão (ou reinicia se terminal), cria Lead, associa ao Workspace. Recebe `terminalStatuses` da instância. |
| `RouteMessageUseCase` | Recebe o status atual da sessão e delega para o handler correto via `StatusHandlerMap`. Não conhece nenhum status específico. |
| `ProcessMessageIdentifyingAgentUseCase` | Executa o agente identificador: coleta nome e categoria do caso, transiciona para `INTERVIEWING`. |
| `ProcessInterviewInterviewerAgentUseCase` | Executa o agente entrevistador: faz perguntas do roteiro, coleta dados, transiciona para `FORWARDED`. |

#### Ports (interfaces que a instância deve implementar)
| Port | Arquivo | O que define |
|---|---|---|
| `IdentifierAgent` | `core/agents/ports/identifier-agent.port.ts` | Método `identify()`: recebe mensagem + histórico + tipos de caso, retorna categoria identificada e nome do contato. |
| `InterviewerAgent` | `core/agents/ports/interviewer-agent.port.ts` | Método `interview()`: recebe perguntas do roteiro + dados coletados, retorna próxima pergunta e dados atualizados. |
| `ChatMemoryPort` | `core/agents/ports/chat-memory.port.ts` | Métodos `getHistory()`, `saveHistory()`, `clear()` para memória do histórico de chat. |
| `InstanceConfig` | `core/config/instance-config.port.ts` | Contrato completo da instância — **o único ponto de extensão do core**. |

#### Controllers HTTP do core
Disponibilizados em `src/core/controllers/` e registrados no `app.ts`:

| Módulo | Rotas |
|---|---|
| `users` | Autenticação, perfil, CRUD de usuários |
| `workspaces` | CRUD de workspaces |
| `leads` | CRUD de leads |
| `screening-flows` | CRUD de fluxos de triagem |
| `ai-sessions` | CRUD de sessões de IA |
| `screening-reports` | CRUD de relatórios de triagem |
| `webhooks` | `POST /webhooks/evolution` — entrada de mensagens WhatsApp |
| `password` | Recuperação de senha |

---

### A Instância — Pontos Variáveis

A instância é tudo que muda entre um domínio e outro. Localizada em `src/instance/` e `src/http/`:

#### Agentes de IA (implementações concretas)
| Agente | Interface implementada | Diferencial |
|---|---|---|
| `GeminiIdentifierAgent` | `IdentifierAgent` | Prompt jurídico que ensina o modelo a identificar nome + categoria do caso (trabalhista, previdenciário, etc.) |
| `GeminiInterviewerAgent` | `InterviewerAgent` | Prompt que conduz entrevista seguindo o roteiro do `ScreeningFlow` e coleta dados estruturados |
| `GeminiCaseAnalyzerAgent` | `CaseAnalyzerAgent` (local) | Agente extra da instância: analisa viabilidade jurídica do caso pós-triagem |

#### Use Cases exclusivos da instância
| Use Case | Responsabilidade |
|---|---|
| `ProcessScreeningAnalyzerAgentUseCase` | Executa análise jurídica via `GeminiCaseAnalyzerAgent` e persiste em `ScreeningReport`. Registrado como hook de `onStatusTransition["FORWARDED"]`. |
| `ConvertLeadToClientUseCase` | Converte um lead em cliente formal. |
| `GenerateContractUseCase` | Geração de contrato com IA. |
| `GeneratePetitionUseCase` | Geração de petição com IA. |
| `CreateLawyerUseCase`, `EditLawyerUseCase`, etc. | CRUD de advogados. |
| `ConnectGoogleCalendarUseCase`, `CreateCalendarEventWithMeetUseCase`, etc. | Integração com Google Calendar e Google Meet. |

#### Controllers HTTP exclusivos da instância
Registrados em `src/http/controllers/` e adicionados ao `app.ts`:

| Módulo | Domínio |
|---|---|
| `lawyers` | CRUD de advogados |
| `clients` | CRUD de clientes |
| `calendar` | Google Calendar, OAuth, eventos |

#### Repositórios exclusivos da instância
Localizados em `src/instance/repositories/`:
- `CalendarConnectionsRepository`
- `CalendarEventsRepository`
- `ClientsRepository`
- `LawyersRepository`

---

### O Contrato: InstanceConfig

**O `InstanceConfig` é o único ponto de extensão do core.** Toda a personalização de um domínio passa por essa interface, definida em [`src/core/config/instance-config.port.ts`](src/core/config/instance-config.port.ts).

```typescript
export interface InstanceConfig {
  /**
   * Label do tipo de workspace nos prompts dos agentes.
   * @example "escritório de advocacia" | "clínica médica"
   */
  workspaceLabel: string;

  /** Implementações dos agentes de IA fornecidas pela instância. */
  agents: {
    identifier: IdentifierAgent;
    interviewer: InterviewerAgent;
  };

  /**
   * Status que indicam que a sessão está encerrada.
   * Nova mensagem do mesmo contato reiniciará a sessão.
   * @example ["BOOKED"] | ["COMPLETED", "DISCHARGED"]
   */
  terminalStatuses: string[];

  /**
   * Mapa de status → handler.
   * Define todos os status suportados e como cada um responde a uma mensagem.
   */
  statusHandlers: StatusHandlerMap;

  /**
   * Mapa de novo-status → hook executado após o core persistir uma transição.
   * Permite reagir a mudanças de estado sem modificar o core.
   */
  onStatusTransition?: StatusTransitionMap;
}
```

---

## 🔄 Fluxo de uma Mensagem WhatsApp

```mermaid
flowchart TD
    WA([WhatsApp / Evolution API]) -->|POST /webhooks/evolution| EWC

    subgraph CORE ["⚙️ Core — fixo"]
        EWC["EvolutionWebhookController\n(injeta lawFirmInstanceConfig)"]
        HIM["HandleIncomingMessageUseCase\n· Busca ou cria AiSession\n· Cria Lead se sessão nova\n· Usa terminalStatuses da instância"]
        RMU["RouteMessageUseCase\n· Consulta statusHandlers[session.status]\n· Completamente genérico"]
        PIAgent["ProcessMessageIdentifyingAgentUseCase\n· Orquestra identificação\n· Dispara onStatusTransition[INTERVIEWING]"]
        PVAgent["ProcessInterviewInterviewerAgentUseCase\n· Orquestra entrevista\n· Dispara onStatusTransition[FORWARDED]"]
    end

    subgraph INSTANCE ["🟢 Instância — variável (advocacia)"]
        GIA["GeminiIdentifierAgent\n(identifica nome + categoria)"]
        GVA["GeminiInterviewerAgent\n(faz perguntas do ScreeningFlow)"]
        PSA["ProcessScreeningAnalyzerAgentUseCase\nhook: onStatusTransition[FORWARDED]"]
        GCA["GeminiCaseAnalyzerAgent\n(análise jurídica do caso)"]
        SR[("ScreeningReport\npersistido no banco")]
        SIL_F["statusHandler[FORWARDED]\nsilencioso — reply: nulo"]
        SIL_BK["statusHandler[BOOKING]\nsilencioso — reply: nulo"]
        SIL_BD["statusHandler[BOOKED]\nsilencioso — nova msg reinicia sessão"]
    end

    EWC --> HIM
    EWC --> RMU
    HIM -->|"AiSession ativa"| RMU

    RMU -->|"status = IDENTIFYING"| PIAgent
    RMU -->|"status = INTERVIEWING"| PVAgent
    RMU -->|"status = FORWARDED"| SIL_F
    RMU -->|"status = BOOKING"| SIL_BK
    RMU -->|"status = BOOKED"| SIL_BD

    PIAgent -->|"usa"| GIA
    GIA -->|"identificado → status INTERVIEWING"| PIAgent

    PVAgent -->|"usa"| GVA
    GVA -->|"triagem completa → status FORWARDED"| PVAgent
    PVAgent -->|"onStatusTransition[FORWARDED]"| PSA
    PSA -->|"usa"| GCA
    GCA -->|"resultado"| SR

    RMU -->|"reply preenchido"| SEND
    SIL_F -->|"reply vazio"| SKIP([ignorado])
    SIL_BK -->|"reply vazio"| SKIP
    SIL_BD -->|"reply vazio"| SKIP

    SEND["sendTextMessage"]
    SEND --> WA2([WhatsApp ← resposta ao lead])

    style CORE fill:#1e2a3a,stroke:#4a9eff,color:#fff
    style INSTANCE fill:#1a3a2a,stroke:#4aff88,color:#fff
    style IA stroke:#4aff88,stroke-width:2px
    style GIA stroke:#4aff88,stroke-width:2px
    style GVA stroke:#4aff88,stroke-width:2px
    style GCA stroke:#4aff88,stroke-width:2px
    style PSA stroke:#4aff88,stroke-width:2px
```

---

## 🔌 Como a Instância Implementa o Core

A implementação completa está em [`src/instance/config/instance-config.ts`](src/instance/config/instance-config.ts).

### 1. `workspaceLabel`

**O que é:** string usada nos prompts dos agentes para contextualizar o tipo de negócio.

```typescript
// Fixo no core (port):
workspaceLabel: string;

// Implementado na instância:
workspaceLabel: "escritório de advocacia",
```

O `GeminiIdentifierAgent` usa esse valor para montar o system prompt:
```typescript
// identifier-prompt.ts
`Você é o assistente virtual do ${workspaceLabel}.`
```

Para uma clínica médica, bastaria mudar para `"clínica médica"` — o prompt se adapta automaticamente.

---

### 2. `agents`

**O que é:** implementações concretas dos agentes de IA. O core só conhece as interfaces.

```typescript
// Port (core) — define o contrato:
export interface IdentifierAgent {
  identify(input: IdentifierAgentInput): Promise<Either<AgentResponseError, IdentifierAgentOutput>>;
}

// Implementação (instância) — usa Gemini com prompt jurídico:
export class GeminiIdentifierAgent implements IdentifierAgent {
  async identify(input: IdentifierAgentInput) {
    const systemInstruction = buildIdentifierSystemPrompt({
      workspaceLabel: input.workspaceLabel,
      caseTypes: input.caseTypes,  // categorias do ScreeningFlow
    });
    // chama aiClient.models.generateContent(...)
    // retorna Either<AgentResponseError, { messageToClient, identifiedCategory, ... }>
  }
}
```

```typescript
// Instância registra os agentes no InstanceConfig:
agents: {
  identifier: new GeminiIdentifierAgent(),
  interviewer: new GeminiInterviewerAgent(),
},
```

As factories do core extraem o agente do config ao construir os use cases:
```typescript
// make-process-message-identifying-agent.ts
new ProcessMessageIdentifyingAgentUseCase(
  ...,
  config.agents.identifier,   // ← vem da instância
  chatMemoryProvider,
  config.workspaceLabel,      // ← vem da instância
);
```

---

### 3. `terminalStatuses`

**O que é:** lista de status que indicam que a sessão foi encerrada. Quando o mesmo contato mandar nova mensagem, o `HandleIncomingMessageUseCase` cria uma nova sessão automaticamente.

```typescript
// Port (core):
terminalStatuses: string[];

// Instância (advocacia):
terminalStatuses: ["BOOKED"],
// → Quando status = "BOOKED", próxima mensagem reinicia o fluxo
```

Para uma clínica médica, poderia ser:
```typescript
terminalStatuses: ["COMPLETED", "DISCHARGED"],
```

O core verifica assim:
```typescript
// handle-incoming-message.ts
const isTerminalSession =
  getSessionResult.isRight() &&
  this.terminalStatuses.includes(getSessionResult.value.aiSession.status);
```

---

### 4. `statusHandlers`

**O que é:** mapa de `status → função handler`. **Define quais status existem** na instância e **o que fazer** quando uma mensagem chega em cada status.

```typescript
// Tipo do handler (core):
type StatusHandler = (
  session: AiSession,
  message: string,
  ctx: StatusHandlerContext,
) => Promise<Either<Error, { reply: string }>>;

// Tipo do mapa (core):
type StatusHandlerMap = Record<string, StatusHandler>;
```

```typescript
// Instância — define 5 status e seus handlers:
statusHandlers: {
  // Status ativo: delega para use case do core (que usa o agente da instância)
  [LAW_FIRM_STATUS.IDENTIFYING]: async (session, message, ctx) => {
    const result = await identifyingUseCase.execute({ aiSession: session, messageText: message });
    if (result.isLeft()) return left(result.value);
    return right({ reply: result.value.messageToClient });
  },

  [LAW_FIRM_STATUS.INTERVIEWING]: async (session, message, ctx) => {
    const result = await interviewingUseCase.execute({
      aiSession: session,
      messageText: message,
      today: today(),
    });
    if (result.isLeft()) return left(result.value);
    return right({ reply: result.value.messageToClient });
  },

  // Status silenciosos: recebem mensagem mas não respondem
  [LAW_FIRM_STATUS.FORWARDED]: async () => right({ reply: "" }),
  [LAW_FIRM_STATUS.BOOKING]:   async () => right({ reply: "" }),
  [LAW_FIRM_STATUS.BOOKED]:    async () => right({ reply: "" }),
},
```

O core usa o mapa sem saber nada sobre os status:
```typescript
// route-message-use-case.ts
const handler = this.statusHandlers[aiSession.status];  // lookup dinâmico
if (!handler) return left(new UnknownStatusError());
const result = await handler(aiSession, messageText, ctx);
```

---

### 5. `onStatusTransition`

**O que é:** mapa de `novo-status → hook`. Executado pelo core **imediatamente após persistir** uma mudança de status. Permite que a instância reaja a eventos de estado sem modificar o core.

```typescript
// Tipos (core):
export interface StatusTransitionContext {
  previousStatus: string;
  newStatus: string;
  aiSession: AiSession;
  collectedData?: CollectedDataItem[];
  contactName?: string;
  today?: string;
}

type StatusTransitionHandler = (ctx: StatusTransitionContext) => Promise<void>;
type StatusTransitionMap = Record<string, StatusTransitionHandler>;
```

```typescript
// Instância (advocacia):
onStatusTransition: {
  // Quando a triagem termina e o caso é encaminhado:
  [LAW_FIRM_STATUS.FORWARDED]: async (ctx) => analyzerUseCase.execute(ctx),
  // analyzerUseCase usa GeminiCaseAnalyzerAgent para analisar o caso juridicamente
  // e persiste o resultado como ScreeningReport
},
```

O core dispara o hook após cada transição:
```typescript
// process-message-identifying-agent.ts
await this.aiSessionRepository.save(aiSession);  // persiste transição
await this.onStatusTransition?.["INTERVIEWING"]?.({
  previousStatus,
  newStatus: "INTERVIEWING",
  aiSession,
  contactName: agentOutput.contactName,
});
```

```typescript
// process-interview-interviewer-agent.ts
await this.aiSessionRepository.save(aiSession);  // persiste transição
await this.onStatusTransition?.["FORWARDED"]?.({
  previousStatus,
  newStatus: "FORWARDED",
  aiSession,
  collectedData: agentOutput.collectedData,
  contactName: agentOutput.contactName,
  today,
});
```

---

## 📁 Estrutura de Pastas

```
src/
├── app.ts                          # Configuração do Fastify + registro de rotas (core + instância)
├── server.ts                       # Inicialização do servidor
│
├── core/                           # ── CORE (genérico, reutilizável) ──────────────────────────────
│   ├── config/
│   │   └── instance-config.port.ts # Contrato InstanceConfig (único ponto de extensão)
│   │
│   ├── agents/
│   │   ├── ports/
│   │   │   ├── identifier-agent.port.ts    # Interface do agente identificador
│   │   │   ├── interviewer-agent.port.ts   # Interface do agente entrevistador
│   │   │   └── chat-memory.port.ts         # Interface de memória de chat
│   │   ├── types/
│   │   │   ├── chat-message.ts
│   │   │   └── collected-data-item.ts
│   │   └── errors/
│   │       └── agent-response-error.ts
│   │
│   ├── orchestrator/
│   │   └── session-status-handler.ts  # Tipos: StatusHandler, StatusHandlerMap, StatusTransitionMap
│   │
│   ├── controllers/                # Controllers HTTP do core
│   │   ├── users/
│   │   ├── workspaces/
│   │   ├── leads/
│   │   ├── screening-flows/
│   │   ├── ai-sessions/
│   │   ├── screening-reports/
│   │   ├── password/
│   │   └── webhooks/
│   │       └── evolution.ts        # Entrada do fluxo WhatsApp (injeta lawFirmInstanceConfig)
│   │
│   ├── repositories/               # Interfaces de repositório (core)
│   │   ├── ai-session-repository.ts
│   │   ├── leads-repository.ts
│   │   ├── screening-flows-repository.ts
│   │   ├── screening-report-repository.ts
│   │   ├── workspaces-repository.ts
│   │   ├── users-repository.ts
│   │   ├── password-reset-tokens-repository.ts
│   │   ├── prisma/                 # Implementações Prisma
│   │   └── in-memory/              # Implementações in-memory (testes)
│   │
│   └── use-cases/                  # Use cases genéricos
│       ├── ai-session/
│       ├── leads/
│       ├── screening-flows/
│       ├── screening-report/
│       ├── workspaces/
│       ├── users/
│       └── orchestrator/
│           ├── handle-incoming-message.ts      # Gerencia sessão + lead
│           ├── route-message-use-case.ts       # Roteador por status
│           └── agents/
│               ├── process-message-identifying-agent.ts
│               ├── process-interview-interviewer-agent.ts
│               └── factories/
│                   ├── make-process-message-identifying-agent.ts
│                   └── make-process-interview-interviewer-agent.ts
│
├── instance/                       # ── INSTÂNCIA (escritório de advocacia) ─────────────────────
│   ├── config/
│   │   └── instance-config.ts      # Implementação do InstanceConfig para advocacia
│   │
│   ├── agents/
│   │   ├── identifier/
│   │   │   ├── gemini-identifier-agent.ts   # IdentifierAgent com Gemini
│   │   │   └── identifier-prompt.ts         # System prompt jurídico de identificação
│   │   ├── interviewer/
│   │   │   ├── gemini-interviewer-agent.ts  # InterviewerAgent com Gemini
│   │   │   └── interviewer-prompt.ts        # System prompt jurídico de entrevista
│   │   └── case-analyzer/
│   │       ├── case-analyzer-agent.ts       # Interface local do analisador
│   │       ├── gemini-case-analyzer-agent.ts # Implementação Gemini
│   │       └── case-analyzer-prompt.ts      # System prompt de análise jurídica
│   │
│   ├── repositories/               # Repositórios exclusivos da instância
│   │   ├── calendar-connections-repository.ts
│   │   ├── calendar-events-repository.ts
│   │   ├── clients-repository.ts
│   │   └── lawyers-repository.ts
│   │
│   └── use-cases/                  # Use cases exclusivos da instância
│       ├── agents/
│       │   └── process-screening-analyzer-agent.ts
│       ├── calendar/               # Integração Google Calendar
│       ├── lawyers/                # CRUD de advogados
│       └── clients/                # CRUD de clientes + geração de documentos
│
├── http/
│   └── controllers/               # Controllers HTTP da instância
│       ├── lawyers/
│       ├── clients/
│       └── calendar/
│
├── env/
│   └── index.ts                   # Validação de variáveis de ambiente com Zod
│
├── lib/
│   ├── prisma.ts                  # Instância do Prisma Client
│   ├── ai.ts                      # Cliente Google Gemini
│   └── evolution.ts               # Cliente Evolution API (WhatsApp)
│
├── providers/
│   ├── agents/
│   │   └── memory/
│   │       └── redis-chat-memory-provider.ts  # ChatMemoryPort via Redis
│   └── evolution/
│       └── evolution-types.ts
│
├── repositories/                  # (Legacy) Repositórios de usuários
│   ├── users-repository.ts
│   ├── prisma/
│   └── in-memory/
│
└── utils/
    ├── either.ts                  # Tipo Either<Error, Success>
    ├── constants.ts               # HTTP_STATUS e ITEM_PER_PAGE
    ├── paginated-results.ts
    └── pagination-params.ts

prisma/
├── schema.prisma                  # Schema do banco de dados
└── migrations/
```

---

## 🗄️ Modelos de Dados

### Entidades do Core (genéricas)

```
AiSession
  id              UUID
  chatId          String        (identificador único do chat no WhatsApp)
  status          String        ← string livre definida pela instância
  chatState       Json          (dados coletados pelo entrevistador)
  screeningFlowId UUID?         (fluxo de triagem associado)
  leadId          UUID?
  name            String        (nome do contato identificado)
  cellphone       String
  isThirdParty    Boolean
  createdAt       DateTime

ScreeningFlow
  id              UUID
  caseType        String        (tipo de caso: "previdenciario", "trabalhista", etc.)
  questions       Json          (mapa { chave: pergunta })
  lawyerId        UUID?

ScreeningReport
  id              UUID
  aiSessionId     UUID
  leadId          UUID
  title           String
  summary         String
  data            Json          ← estrutura livre definida pela instância

Lead
  id              UUID
  name            String
  cellphone       String
  email           String?
  status          LeadStatus    (NEW_LEAD | INTERVIEWING | FORWARDED | COMPLETED)
  workspaceId     UUID
  lawyerId        UUID?

Workspace
  id              UUID
  name            String
  cnpj            String (único)
  email           String
  cellphone       String
```

### Entidades da Instância (advocacia)

```
Lawyer
  id              UUID
  name            String
  oab             String
  oabState        String
  cellphone       String
  pix             String
  userId          UUID (→ User)
  workspaceId     UUID

Client
  id              UUID
  name, cpf, rg, email, cellphone
  maritalStatus, profession
  street, neighborhood, city, state, zipCode
  workspaceId     UUID
  lawyerId        UUID?
  createdFromLeadId UUID?

CalendarEvent / GoogleCalendarConnection
  (integração OAuth Google Calendar)

PasswordResetToken
  (recuperação de senha por e-mail)
```

---

## 🧩 Camadas da Aplicação

### 1. Controllers (HTTP Layer)

Recebem requisições HTTP, validam com **Zod**, chamam use cases e retornam respostas.

```typescript
export const EvolutionWebhookController: FastifyPluginAsyncZod = async (app) => {
  app.post("/webhooks/evolution", { schema: { ... } }, async (request, reply) => {
    // injeta a config da instância
    const handleUseCase = makeHandleIncomingMessageUseCase(lawFirmInstanceConfig);
    const routeUseCase  = makeRouteMessageUseCase(lawFirmInstanceConfig);
    // ...
  });
};
```

### 2. Use Cases (Business Logic)

Uma classe por caso de uso. Recebem dependências injetadas. Retornam `Either<Error, Success>`.

```typescript
export class RouteMessageUseCase {
  constructor(private readonly statusHandlers: StatusHandlerMap) {}

  async execute({ aiSession, messageText }) {
    const handler = this.statusHandlers[aiSession.status];
    if (!handler) return left(new UnknownStatusError());
    return handler(aiSession, messageText, ctx);
  }
}
```

### 3. Repositories (Data Access)

Interface no core + implementações Prisma e in-memory.

```typescript
// Interface (core)
export interface ScreeningFlowsRepository {
  create(data): Promise<ScreeningFlow>;
  findById(id): Promise<ScreeningFlow | null>;
  findMany(params): Promise<PaginatedResult<ScreeningFlow>>;
  save(flow): Promise<ScreeningFlow>;
  delete(id): Promise<void>;
}

// Implementação Prisma (core/repositories/prisma/)
// Implementação in-memory (core/repositories/in-memory/) — usada em testes
```

### 4. Agents (IA Layer)

Implementações na instância, interfaces no core.

```typescript
// Core define:
interface IdentifierAgent {
  identify(input: IdentifierAgentInput): Promise<Either<AgentResponseError, IdentifierAgentOutput>>;
}

// Instância implementa com Gemini:
class GeminiIdentifierAgent implements IdentifierAgent {
  async identify(input) {
    const systemInstruction = buildIdentifierSystemPrompt({ ... });
    const response = await aiClient.models.generateContent({ ... });
    // parse + validate com Zod
    return right(result.data);
  }
}
```

### 5. Either (Error Handling)

Padrão funcional para tratar erros sem exceções.

```typescript
// Left = erro, Right = sucesso
type Result = Either<UserNotFoundError, { user: User }>;

const result = await useCase.execute(id);

if (result.isLeft()) {
  const error = result.value; // UserNotFoundError
  return reply.status(404).send({ message: error.message });
}

const { user } = result.value; // sucesso garantido
```

---

## 🔨 Guia de Desenvolvimento

### Adicionar novo Status ao Fluxo

**Passo 1:** Declare o status na instância:
```typescript
// instance/config/instance-config.ts
export const LAW_FIRM_STATUS = {
  // ...existentes
  RESCHEDULE: "RESCHEDULE",
} as const;
```

**Passo 2:** Adicione o handler no `statusHandlers`:
```typescript
statusHandlers: {
  // ...existentes
  [LAW_FIRM_STATUS.RESCHEDULE]: async (session, message, ctx) => {
    // lógica de reagendamento
    return right({ reply: "Certo! Quando prefere remarcar?" });
  },
},
```

**Passo 3:** Se necessário, adicione hook de transição:
```typescript
onStatusTransition: {
  // ...existentes
  [LAW_FIRM_STATUS.RESCHEDULE]: async (ctx) => {
    await notificationService.notify(ctx);
  },
},
```

---

### Criar um Novo Use Case

**Passo 1 — Use case:**
```typescript
// core/use-cases/leads/archive-lead.ts
export class ArchiveLeadUseCase {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  async execute({ leadId }: { leadId: string }): Promise<Either<LeadNotFoundError, { lead: Lead }>> {
    const lead = await this.leadsRepository.findById(leadId);
    if (!lead) return left(new LeadNotFoundError());
    lead.status = "COMPLETED";
    const updated = await this.leadsRepository.save(lead);
    return right({ lead: updated });
  }
}
```

**Passo 2 — Factory:**
```typescript
// core/use-cases/leads/factories/make-archive-lead.ts
export function makeArchiveLead() {
  return new ArchiveLeadUseCase(new PrismaLeadsRepository());
}
```

**Passo 3 — Testes:**
```typescript
// core/use-cases/leads/archive-lead.spec.ts
describe("ArchiveLeadUseCase", () => {
  let leadsRepository: InMemoryLeadsRepository;
  let sut: ArchiveLeadUseCase;

  beforeEach(() => {
    leadsRepository = new InMemoryLeadsRepository();
    sut = new ArchiveLeadUseCase(leadsRepository);
  });

  it("should archive a lead", async () => {
    const lead = await leadsRepository.create({ name: "João", cellphone: "11999" });
    const result = await sut.execute({ leadId: lead.id });
    expect(result.isRight()).toBe(true);
    expect(result.value.lead.status).toBe("COMPLETED");
  });
});
```

**Passo 4 — Controller e rota** (quando necessário).

---

### Adicionar novo Método ao Repositório

1. **Interface** (`core/repositories/leads-repository.ts`): `archive(id: string): Promise<Lead>;`
2. **Prisma** (`core/repositories/prisma/prisma-leads-repository.ts`): implementar
3. **In-Memory** (`core/repositories/in-memory/in-memory-leads-repository.ts`): implementar

---

### Criar nova Instância para outro Domínio

Para adaptar o sistema a uma clínica médica, por exemplo:

```typescript
// src/instance/config/clinic-instance-config.ts
export const CLINIC_STATUS = {
  IDENTIFYING: "IDENTIFYING",
  INTERVIEWING: "INTERVIEWING",
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  DISCHARGED: "DISCHARGED",
} as const;

export const clinicInstanceConfig: InstanceConfig = {
  workspaceLabel: "clínica médica",
  agents: {
    identifier: new GeminiClinicIdentifierAgent(),
    interviewer: new GeminiClinicInterviewerAgent(),
  },
  terminalStatuses: [CLINIC_STATUS.COMPLETED, CLINIC_STATUS.DISCHARGED],
  statusHandlers: {
    [CLINIC_STATUS.IDENTIFYING]: async (session, message) => { /* ... */ },
    [CLINIC_STATUS.INTERVIEWING]: async (session, message) => { /* ... */ },
    [CLINIC_STATUS.SCHEDULED]: async () => right({ reply: "" }),
    [CLINIC_STATUS.COMPLETED]: async () => right({ reply: "" }),
    [CLINIC_STATUS.DISCHARGED]: async () => right({ reply: "" }),
  },
  onStatusTransition: {
    [CLINIC_STATUS.SCHEDULED]: async (ctx) => scheduleNotificationService.notify(ctx),
  },
};
```

O webhook simplesmente troca o config injetado:
```typescript
// evolution.ts
const handleUseCase = makeHandleIncomingMessageUseCase(clinicInstanceConfig);
```

---

## 📚 Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Classes | PascalCase | `GeminiIdentifierAgent` |
| Funções | camelCase | `makeRouteMessageUseCase` |
| Constantes | UPPER_SNAKE_CASE | `LAW_FIRM_STATUS` |
| Interfaces | PascalCase | `InstanceConfig`, `IdentifierAgent` |
| Ports | sufixo `.port.ts` | `identifier-agent.port.ts` |
| Erros de domínio | sufixo `Error` | `ScreeningFlowNotFoundError` |
| Factories | prefixo `make-` | `make-process-message-identifying-agent.ts` |
| Testes | sufixo `.spec.ts` | `create-lead.spec.ts` |

---

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev          # Inicia servidor em modo watch

# Testes
pnpm test         # Executa testes uma vez
pnpm test:watch   # Testes em modo watch
pnpm test:ui      # Interface visual de testes

# Banco de Dados
pnpm db:generate  # Gera Prisma Client
pnpm db:migrate   # Roda migrações
pnpm db:studio    # Abre Prisma Studio

# Qualidade de Código
pnpm check        # Lint com Biome
pnpm fix          # Corrige problemas de lint

# Build
pnpm build        # Compila TypeScript
pnpm start        # Inicia aplicação compilada
```

---

## ⚙️ Variáveis de Ambiente

```env
# Servidor
NODE_ENV=development
PORT=3333

# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5432/vero

# Autenticação
JWT_SECRET=sua_chave_secreta

# Google Gemini (Agentes de IA)
GEMINI_API_KEY=AIza...

# Redis (Memória de Chat dos Agentes)
REDIS_HOST=localhost
REDIS_PORT=6379

# Evolution API (Gateway WhatsApp)
EVOLUTION_API_URL=https://seu-evolution-server.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia

# Google Calendar (OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# E-mail (Recuperação de Senha)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

---

## 🔐 Autenticação

A API usa **JWT (Bearer tokens)** com expiração de 10 minutos.

```bash
# Autenticar
POST /users/authenticate
{ "email": "user@example.com", "password": "senha123" }

# Resposta
{ "access_token": "eyJhbGc...", "user": { ... } }

# Usar em requisições protegidas
GET /me
Authorization: Bearer eyJhbGc...
```

Documentação interativa disponível em `http://localhost:3333/docs` (Scalar API Reference, gerado automaticamente do schema OpenAPI).

---

## 👤 Autores

- **José Victor**
- **Andre Lira**
- **Nathan Oliveira**

---

**Última atualização:** Junho de 2026
