# Guia: Criando uma Nova Instância do Framework

> Este guia detalha, passo a passo, como clonar o projeto e adaptar uma **nova instância** para um domínio diferente da advocacia (ex: clínica médica, construtora, imobiliária, etc.).
>
> O princípio central é simples: **tudo dentro de `src/instance/` pertence à instância atual (advocacia)**. Tudo fora é o framework — não deve ser alterado.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Clonar e configurar o projeto](#2-clonar-e-configurar-o-projeto)
3. [O que remover da instância atual](#3-o-que-remover-da-instância-atual)
4. [O que manter do framework](#4-o-que-manter-do-framework)
5. [Construindo a nova instância — passo a passo](#5-construindo-a-nova-instância--passo-a-passo)
6. [Adaptar o schema do banco (opcional)](#6-adaptar-o-schema-do-banco-opcional)
7. [Registrar as rotas da instância no app](#7-registrar-as-rotas-da-instância-no-app)
8. [Variáveis de ambiente](#8-variáveis-de-ambiente)
9. [Checklist final](#9-checklist-final)

---

## 1. Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** (para PostgreSQL e Redis locais)
- Conta **Google AI Studio** (para a chave da API Gemini)
- Conta **Evolution API** (para o webhook do WhatsApp)

---

## 2. Clonar e Configurar o Projeto

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio> minha-nova-instancia
cd minha-nova-instancia

# 2. Instalar dependências
pnpm install

# 3. Copiar e preencher as variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com os valores do seu ambiente. Veja a seção [8. Variáveis de ambiente](#8-variáveis-de-ambiente) para referência.

```bash
# 4. Subir banco de dados e Redis
docker compose up -d

# 5. Rodar as migrations do banco
pnpm prisma migrate dev

# 6. Gerar o Prisma Client
pnpm prisma generate
```

---

## 3. O que Remover da Instância Atual

A instância atual (advocacia) está contida **quase inteiramente** em `src/instance/`. O restante está em `src/http/` (controllers de rotas exclusivas da instância) e em arquivos específicos de `src/app.ts`.

### 3.1 Apagar todo o diretório `src/instance/`

```bash
rm -rf src/instance/
```

Este diretório contém:

| Subdiretório | O que contém | Motivo da remoção |
|---|---|---|
| `src/instance/agents/identifier/` | `GeminiIdentifierAgent` + prompt jurídico | Prompt e lógica são específicos da advocacia |
| `src/instance/agents/interviewer/` | `GeminiInterviewerAgent` + prompt jurídico | Idem |
| `src/instance/agents/case-analyzer/` | `GeminiCaseAnalyzerAgent` + interface + prompt | Agente de análise jurídica — específico do domínio |
| `src/instance/config/` | `instance-config.ts` com `createLawFirmInstanceConfig()` | Status, handlers e hooks são jurídicos |
| `src/instance/use-cases/agents/` | `ProcessScreeningAnalyzerAgentUseCase` | Hook pós-triagem específico da advocacia |
| `src/instance/use-cases/clients/` | CRUD de clientes com lógica jurídica (contratos, petições) | Entidade e lógica exclusivas do domínio |
| `src/instance/use-cases/lawyers/` | CRUD de advogados | Entidade exclusiva do domínio |
| `src/instance/use-cases/calendar/` | Integração Google Calendar | Opcional — manter ou remover conforme necessidade |
| `src/instance/repositories/` | Interfaces de `ClientsRepository`, `LawyersRepository`, etc. | Repositórios de entidades específicas |

### 3.2 Apagar o diretório `src/http/controllers/`

```bash
rm -rf src/http/controllers/
```

Contém controllers HTTP específicos da instância atual:

| Diretório | O que contém |
|---|---|
| `src/http/controllers/lawyers/` | Rotas REST dos advogados |
| `src/http/controllers/clients/` | Rotas REST dos clientes |
| `src/http/controllers/calendar/` | Rotas de integração Google Calendar |

### 3.3 Editar `src/app.ts` — remover imports e registros da instância atual

Abra `src/app.ts` e remova as linhas marcadas:

```typescript
// REMOVER estas linhas de import:
import { lawyersRoutes } from "@/http/controllers/lawyers/routes";
import { clientsRoutes } from "@/http/controllers/clients/routes";
import { calendarRoutes } from "@/http/controllers/calendar/routes";

// REMOVER estes registros:
app.register(calendarRoutes);
app.register(lawyersRoutes);
app.register(clientsRoutes);
```

**Manter** todos os imports e registros com o prefixo `@/core/`:

```typescript
// MANTER — são do framework
import { usersRoutes } from "@/core/controllers/users/routes";
import { aiSessionsRoutes } from "@/core/controllers/ai-sessions/routes";
import { screeningFlowsRoutes } from "@/core/controllers/screening-flows/routes";
import { workspacesRoutes } from "@/core/controllers/workspaces/routes";
import { leadsRoutes } from "@/core/controllers/leads/routes";
import { webhooksRoutes } from "@/core/controllers/webhooks/routes";
import { passwordRoutes } from "@/core/controllers/password/routes";
import { screeningReportsRoutes } from "@/core/controllers/screening-reports/routes";
```

### 3.4 Limpar o schema Prisma (opcional — se não for usar entidades jurídicas)

Abra `prisma/schema.prisma` e remova os models específicos da advocacia que não serão usados:

```
# Remover se não forem usados no novo domínio:
model Lawyer { ... }
model Client { ... }
model GoogleCalendarConnection { ... }
model CalendarEvent { ... }
model CaseAnalysis { ... }   ← deprecated, pode remover com segurança

# Remover enum se não usar Lawyer:
# (o enum Role pode ser mantido se quiser controle de acesso por papel)
```

**Manter obrigatoriamente** (são do framework):

```
model User { ... }
model Workspace { ... }
model Lead { ... }
model ScreeningFlow { ... }
model AiSession { ... }
model ScreeningReport { ... }
model PasswordResetToken { ... }
```

Após editar o schema:

```bash
pnpm prisma migrate dev --name remove_law_firm_entities
```

---

## 4. O que Manter do Framework

Nunca modifique estes arquivos — eles são o núcleo do framework:

```
src/core/                          ← Nunca alterar
├── agents/ports/                  ← Interfaces dos agentes (contratos)
├── config/instance-config.port.ts ← Contrato da instância
├── controllers/                   ← Controllers HTTP do core
├── orchestrator/                  ← Tipos de transição e handlers
├── repositories/                  ← Interfaces de repositório
└── use-cases/                     ← Todos os use cases do core

src/providers/                     ← Manter (Redis, Evolution, memória)
src/lib/                           ← Manter (AI client, Evolution client)
src/infra/                         ← Manter (email)
src/utils/                         ← Manter (Either, paginação, constantes)
src/@types/                        ← Manter (tipagens globais)
src/env/                           ← Manter (validação de env vars)

prisma/schema.prisma               ← Editar apenas para adicionar/remover
                                      models da instância (seção 6)
```

---

## 5. Construindo a Nova Instância — Passo a Passo

Para este guia, usaremos como exemplo uma **clínica médica**.

### Passo 1: Criar a estrutura de diretórios

```bash
mkdir -p src/instance/agents/identifier
mkdir -p src/instance/agents/interviewer
mkdir -p src/instance/agents/post-screening    # equivalente ao case-analyzer
mkdir -p src/instance/config
mkdir -p src/instance/use-cases/post-screening
mkdir -p src/instance/repositories
mkdir -p src/http/controllers/patients         # entidade específica da clínica
```

---

### Passo 2: Implementar o `IdentifierAgent`

**Arquivo:** `src/instance/agents/identifier/identifier-prompt.ts`

O prompt determina como o agente conversa com o contato no WhatsApp durante a fase de **identificação**. Adapte para o domínio:

```typescript
interface IdentifierPromptParams {
  workspaceLabel: string;
  caseTypes: string[];
}

export function buildIdentifierSystemPrompt({
  workspaceLabel,
  caseTypes,
}: IdentifierPromptParams): string {
  const caseTypesFormatted = caseTypes.map((type) => `- ${type}`).join("\n");

  return `## PERSONA E OBJETIVO
Você é o assistente virtual da ${workspaceLabel}. Seu objetivo é coletar o nome do paciente,
descobrir o tipo de consulta/especialidade desejada e direcionar para o setor correto.

## TIPOS DE ATENDIMENTO DISPONÍVEIS:
${caseTypesFormatted}

## REGRAS DE COMPORTAMENTO:
1. SE NÃO SOUBER O NOME: Cumprimente e peça o nome completo do paciente.
2. SE SOUBER O NOME, MAS NÃO O TIPO: Chame pelo primeiro nome e pergunte o motivo da consulta.
3. SE SOUBER O NOME E O TIPO: Confirme que entendeu e avise que fará algumas perguntas rápidas.

## FORMATO DE SAÍDA OBRIGATÓRIO (JSON):
{
  "messageToClient": "Sua resposta humanizada aqui.",
  "identifiedCategory": "A categoria identificada ou 'nao_identificado'",
  "isThirdParty": false,
  "contactName": "Nome completo ou 'nao_identificado'"
}`;
}
```

**Arquivo:** `src/instance/agents/identifier/gemini-identifier-agent.ts`

A implementação concreta pode ser copiada da instância anterior e ajustada:

```typescript
import { Type } from "@google/genai";
import { z } from "zod";
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import type {
  IdentifierAgent,
  IdentifierAgentInput,
  IdentifierAgentOutput,
} from "@core/agents/ports/identifier-agent.port";
import { buildIdentifierSystemPrompt } from "./identifier-prompt";
import type { ChatMessage } from "@core/agents/types/chat-message";
import { AgentResponseError } from "@core/agents/errors/agent-response-error";

const AGENT_NAME = "identifier";
const MODEL = "gemini-2.5-flash"; // Troque o modelo conforme necessidade

// Schema de validação da resposta do modelo
const identifierResponseSchema = z.object({
  messageToClient: z.string(),
  identifiedCategory: z.string(),
  isThirdParty: z.boolean(),
  contactName: z.string(),
});

// JSON Schema para structured output do Gemini
const identifierJsonSchema = {
  type: Type.OBJECT,
  properties: {
    messageToClient: { type: Type.STRING },
    identifiedCategory: { type: Type.STRING },
    isThirdParty: { type: Type.BOOLEAN },
    contactName: { type: Type.STRING },
  },
  required: ["messageToClient", "identifiedCategory", "isThirdParty", "contactName"],
};

function buildContents(chatHistory: ChatMessage[], message: string) {
  const contents = chatHistory.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

export class GeminiIdentifierAgent implements IdentifierAgent {
  async identify(
    input: IdentifierAgentInput,
  ): Promise<Either<AgentResponseError, IdentifierAgentOutput>> {
    const systemInstruction = buildIdentifierSystemPrompt({
      workspaceLabel: input.workspaceLabel,
      caseTypes: input.caseTypes,
    });

    const contents = buildContents(input.chatHistory ?? [], input.message);

    const response = await aiClient.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: identifierJsonSchema,
      },
    });

    const parsed = JSON.parse(response.text ?? "{}");
    const result = identifierResponseSchema.safeParse(parsed);

    if (!result.success) {
      return left(new AgentResponseError(AGENT_NAME, result.error.message));
    }

    return right(result.data);
  }
}
```

---

### Passo 3: Implementar o `InterviewerAgent`

**Arquivo:** `src/instance/agents/interviewer/interviewer-prompt.ts`

O prompt define como o agente conduz a **entrevista de triagem**. Adapte o contexto para o domínio:

```typescript
import type { CollectedDataItem } from "@core/agents/types/collected-data-item";

interface InterviewerPromptParams {
  isThirdParty: boolean;
  contactName: string;
  caseCategory: string;
  questions: Record<string, string>;
  collectedData: CollectedDataItem[];
  today: string;
}

export function buildInterviewerSystemPrompt({
  isThirdParty,
  contactName,
  caseCategory,
  questions,
  collectedData,
  today,
}: InterviewerPromptParams): string {
  const questionsFormatted = Object.entries(questions)
    .map(([key, q]) => `  -> [Chave: "${key}"] Pergunta: "${q}"`)
    .join("\n");

  const collectedDataFormatted =
    collectedData.length > 0 ? JSON.stringify(collectedData) : "[]";

  return `## PERSONA E OBJETIVO
Você é o assistente de triagem da clínica. Seu tom é amigável, empático e objetivo.
Você está conversando via WhatsApp. Seja direto e conciso.

## CONTEXTO (INJETADO PELO SISTEMA)
- É para terceiros: ${isThirdParty}
- Nome do paciente: ${contactName}
- Especialidade: ${caseCategory}
- Roteiro de perguntas:
${questionsFormatted}
- Dados já coletados: ${collectedDataFormatted}

## REGRAS:
1. Siga SOMENTE o roteiro — nunca invente perguntas.
2. Faça UMA pergunta por mensagem.
3. Se o paciente já respondeu indiretamente, deduza e preencha.
4. Quando TODOS os dados estiverem coletados, encerre dizendo que as informações foram enviadas à clínica.

## FORMATO DE SAÍDA OBRIGATÓRIO (JSON):
{
  "contactName": "Nome do paciente",
  "nextQuestionToClient": "Sua pergunta aqui.",
  "collectedData": [
    { "field": "CHAVE_EXATA_DO_ROTEIRO", "answer": "Resposta ou 'ainda_nao_perguntado'" }
  ],
  "screeningCompleted": false
}

Data de hoje: ${today}`;
}
```

**Arquivo:** `src/instance/agents/interviewer/gemini-interviewer-agent.ts`

A implementação segue o mesmo padrão do identificador — copie da instância anterior e substitua a referência ao prompt:

```typescript
import { Type } from "@google/genai";
import { z } from "zod";
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import type {
  InterviewerAgent,
  InterviewerAgentInput,
  InterviewerAgentOutput,
} from "@core/agents/ports/interviewer-agent.port";
import { buildInterviewerSystemPrompt } from "./interviewer-prompt";
import type { ChatMessage } from "@core/agents/types/chat-message";
import type { CollectedDataItem } from "@core/agents/types/collected-data-item";
import { AgentResponseError } from "@core/agents/errors/agent-response-error";

const AGENT_NAME = "interviewer";
const MODEL = "gemini-2.5-flash";

const interviewerResponseSchema = z.object({
  contactName: z.string(),
  nextQuestionToClient: z.string(),
  collectedData: z.array(z.object({ field: z.string(), answer: z.string() })),
  screeningCompleted: z.boolean(),
});

const interviewerJsonSchema = {
  type: Type.OBJECT,
  properties: {
    contactName: { type: Type.STRING },
    nextQuestionToClient: { type: Type.STRING },
    collectedData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["field", "answer"],
      },
    },
    screeningCompleted: { type: Type.BOOLEAN },
  },
  required: ["contactName", "nextQuestionToClient", "collectedData", "screeningCompleted"],
};

function buildContents(chatHistory: ChatMessage[], message: string) {
  const contents = chatHistory.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

export class GeminiInterviewerAgent implements InterviewerAgent {
  async interview(
    input: InterviewerAgentInput,
  ): Promise<Either<AgentResponseError, InterviewerAgentOutput>> {
    const systemInstruction = buildInterviewerSystemPrompt({
      isThirdParty: input.isThirdParty,
      contactName: input.contactName,
      caseCategory: input.caseCategory,
      questions: input.questions,
      collectedData: input.collectedData as CollectedDataItem[],
      today: input.today,
    });

    const contents = buildContents(input.chatHistory ?? [], input.message);

    const response = await aiClient.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: interviewerJsonSchema,
      },
    });

    const parsed = JSON.parse(response.text ?? "{}");
    const result = interviewerResponseSchema.safeParse(parsed);

    if (!result.success) {
      return left(new AgentResponseError(AGENT_NAME, result.error.message));
    }

    return right(result.data as InterviewerAgentOutput);
  }
}
```

---

### Passo 4: Implementar o Agente Pós-Triagem (opcional)

O agente pós-triagem é o que executa a lógica de domínio quando `onStatusTransition["FORWARDED"]` é disparado. Na advocacia, era o analisador jurídico. Para uma clínica, pode ser um gerador de ficha de paciente.

**Arquivo:** `src/instance/agents/post-screening/post-screening-agent.ts`

```typescript
import type { Either } from "@/utils/either";
import type { CollectedDataItem } from "@core/agents/types/collected-data-item";
import type { AgentResponseError } from "@core/agents/errors/agent-response-error";

export interface PostScreeningAgentInput {
  patientName: string;
  collectedData: CollectedDataItem[];
  today: string;
}

export interface PostScreeningAgentOutput {
  title: string;
  summary: string;
  data: Record<string, unknown>; // estrutura livre para o ScreeningReport.data
}

export interface PostScreeningAgent {
  process(
    input: PostScreeningAgentInput,
  ): Promise<Either<AgentResponseError, PostScreeningAgentOutput>>;
}
```

**Arquivo:** `src/instance/agents/post-screening/gemini-post-screening-agent.ts`

```typescript
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import { AgentResponseError } from "@core/agents/errors/agent-response-error";
import { z } from "zod";
import type { PostScreeningAgent, PostScreeningAgentInput, PostScreeningAgentOutput } from "./post-screening-agent";

const AGENT_NAME = "postScreening";
const MODEL = "gemini-2.5-flash";

const responseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  urgencyLevel: z.enum(["Baixa", "Média", "Alta"]),
  recommendedSpecialty: z.string(),
  notes: z.string(),
});

export class GeminiPostScreeningAgent implements PostScreeningAgent {
  async process(
    input: PostScreeningAgentInput,
  ): Promise<Either<AgentResponseError, PostScreeningAgentOutput>> {
    const systemInstruction = `
      Você é um sistema de triagem médica. Com base nos dados coletados do paciente,
      gere um resumo estruturado para a equipe de saúde.
      Data: ${input.today}
    `;

    const userPrompt = JSON.stringify({
      patientName: input.patientName,
      collectedData: input.collectedData,
    });

    const response = await aiClient.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text ?? "{}");
    const result = responseSchema.safeParse(parsed);

    if (!result.success) {
      return left(new AgentResponseError(AGENT_NAME, result.error.message));
    }

    const { title, summary, urgencyLevel, recommendedSpecialty, notes } = result.data;

    return right({
      title,
      summary,
      data: { urgencyLevel, recommendedSpecialty, notes },
    });
  }
}
```

---

### Passo 5: Implementar o Hook de Pós-Triagem

**Arquivo:** `src/instance/use-cases/post-screening/process-post-screening.ts`

Este use case será registrado em `onStatusTransition["FORWARDED"]`:

```typescript
import type { StatusTransitionContext } from "@core/orchestrator/session-status-handler";
import type { PostScreeningAgent } from "@instance/agents/post-screening/post-screening-agent";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";

export class ProcessPostScreeningUseCase {
  constructor(
    private readonly postScreeningAgent: PostScreeningAgent,
    private readonly screeningReportRepository: ScreeningReportRepository,
  ) {}

  async execute(ctx: StatusTransitionContext): Promise<void> {
    const { aiSession, contactName, collectedData, today } = ctx;
    const leadId = aiSession.leadId;

    if (!contactName || !collectedData || !today || !leadId) {
      console.warn("[ProcessPostScreening] Contexto incompleto — ignorado.");
      return;
    }

    const agentResult = await this.postScreeningAgent.process({
      patientName: contactName,
      collectedData,
      today,
    });

    if (agentResult.isLeft()) {
      console.error("[ProcessPostScreening] Falha:", agentResult.value);
      return; // não-fatal — triagem já foi concluída
    }

    const { title, summary, data } = agentResult.value;

    await this.screeningReportRepository.create({
      aiSessionId: aiSession.id,
      leadId,
      title,
      summary,
      data,
    });
  }
}
```

---

### Passo 6: Criar o `InstanceConfig`

**Arquivo:** `src/instance/config/instance-config.ts`

Este é o **coração da instância**. Ele implementa o contrato `InstanceConfig` do framework:

```typescript
import { right, left } from "@/utils/either";
import type { InstanceConfig } from "@core/config/instance-config.port";
import { GeminiIdentifierAgent } from "@instance/agents/identifier/gemini-identifier-agent";
import { GeminiInterviewerAgent } from "@instance/agents/interviewer/gemini-interviewer-agent";
import { GeminiPostScreeningAgent } from "@instance/agents/post-screening/gemini-post-screening-agent";
import { ProcessPostScreeningUseCase } from "@instance/use-cases/post-screening/process-post-screening";
import { makeProcessMessageIdentifyingAgentUseCase } from "@/core/use-cases/orchestrator/agents/factories/make-process-message-identifying-agent";
import { makeProcessInterviewInterviewerAgentUseCase } from "@/core/use-cases/orchestrator/agents/factories/make-process-interview-interviewer-agent";
import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";

// ─────────────────────────────────────────────────────────────────────────────
// Status desta instância — defina os status que fazem sentido para o domínio
// ─────────────────────────────────────────────────────────────────────────────
export const CLINIC_STATUS = {
  IDENTIFYING: "IDENTIFYING",       // identificando o paciente e especialidade
  INTERVIEWING: "INTERVIEWING",     // coletando dados para triagem
  FORWARDED: "FORWARDED",           // dados enviados para a equipe médica
  SCHEDULED: "SCHEDULED",          // consulta agendada (terminal)
} as const;

export function createClinicInstanceConfig(): InstanceConfig {
  // Instanciar o use case pós-triagem
  const postScreeningUseCase = new ProcessPostScreeningUseCase(
    new GeminiPostScreeningAgent(),
    new PrismaScreeningReportRepository(),
  );

  // Montar config base (sem os handlers que dependem dela)
  const baseConfig = {
    workspaceLabel: "clínica médica",     // ← adapte para o domínio
    agents: {
      identifier: new GeminiIdentifierAgent(),
      interviewer: new GeminiInterviewerAgent(),
    },
    terminalStatuses: [CLINIC_STATUS.SCHEDULED],  // ← status que reiniciam o fluxo
  } satisfies Omit<InstanceConfig, "statusHandlers" | "onStatusTransition">;

  // Montar os use cases de agente do core com a config
  const identifyingUseCase = makeProcessMessageIdentifyingAgentUseCase(
    baseConfig as InstanceConfig,
  );
  const interviewingUseCase = makeProcessInterviewInterviewerAgentUseCase(
    baseConfig as InstanceConfig,
  );

  const today = () =>
    new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const config: InstanceConfig = {
    ...baseConfig,

    // ─────────────────────────────────────────────────────────────────────
    // Handlers de status — um por status possível da sessão
    // ─────────────────────────────────────────────────────────────────────
    statusHandlers: {
      /** Identifica o paciente e a especialidade */
      [CLINIC_STATUS.IDENTIFYING]: async (session, message, ctx) => {
        const result = await identifyingUseCase.execute({
          aiSession: session,
          messageText: message,
        });
        if (result.isLeft()) return left(result.value);
        return right({ reply: result.value.messageToClient });
      },

      /** Realiza a triagem de dados */
      [CLINIC_STATUS.INTERVIEWING]: async (session, message, ctx) => {
        const result = await interviewingUseCase.execute({
          aiSession: session,
          messageText: message,
          today: today(),
        });
        if (result.isLeft()) return left(result.value);
        return right({ reply: result.value.messageToClient });
      },

      /** Dados encaminhados para a clínica — silencioso */
      [CLINIC_STATUS.FORWARDED]: async () => right({ reply: "" }),

      /** Consulta agendada — silencioso (nova mensagem reiniciará o fluxo) */
      [CLINIC_STATUS.SCHEDULED]: async () => right({ reply: "" }),
    },

    // ─────────────────────────────────────────────────────────────────────
    // Hooks de transição — executados após cada mudança de status
    // ─────────────────────────────────────────────────────────────────────
    onStatusTransition: {
      /** Quando a triagem é concluída, gera a ficha do paciente */
      [CLINIC_STATUS.FORWARDED]: async (ctx) => postScreeningUseCase.execute(ctx),

      // Exemplos de outros hooks possíveis:
      // [CLINIC_STATUS.INTERVIEWING]: async (ctx) => notificationService.alertTeam(ctx),
      // [CLINIC_STATUS.SCHEDULED]: async (ctx) => calendarService.createEvent(ctx),
    },
  };

  return config;
}

/** Singleton da configuração — use este export nos controllers/webhooks */
export const clinicInstanceConfig = createClinicInstanceConfig();
```

---

### Passo 7: Conectar o `InstanceConfig` ao Webhook

**Arquivo:** `src/core/controllers/webhooks/evolution.ts`

Altere apenas o import da configuração no controller de webhook. **Este é o único arquivo do core que referencia a instância diretamente.**

```typescript
// ANTES (advocacia):
import { lawFirmInstanceConfig } from "@instance/config/instance-config";

// DEPOIS (clínica):
import { clinicInstanceConfig } from "@instance/config/instance-config";

// E atualize as referências no corpo do handler:
const handleIncomingMessageUseCase = makeHandleIncomingMessageUseCase(clinicInstanceConfig);
// ...
const routeMessageUseCase = makeRouteMessageUseCase(clinicInstanceConfig);
```

---

### Passo 8: Criar Entidades Específicas do Domínio (se necessário)

Se o seu domínio precisar de entidades além das que o framework já fornece (User, Workspace, Lead, ScreeningFlow, AiSession, ScreeningReport), crie-as na instância.

**Exemplo: modelo `Patient` para a clínica**

Adicione ao `prisma/schema.prisma`:

```prisma
model Patient {
  id          String   @id @default(uuid())
  name        String
  cpf         String
  dateOfBirth DateTime @map("date_of_birth")
  phone       String
  healthPlan  String?  @map("health_plan")
  workspaceId String   @map("workspace_id")
  leadId      String?  @unique @map("lead_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  lead      Lead?     @relation(fields: [leadId], references: [id])

  @@map("patients")
  @@schema("vero")
}
```

Adicione o relacionamento no model `Workspace`:
```prisma
model Workspace {
  // ...campos existentes...
  patients Patient[]   // ← adicionar
}
```

Depois rode:
```bash
pnpm prisma migrate dev --name add_patient_model
pnpm prisma generate
```

Crie a interface do repositório em `src/instance/repositories/patients-repository.ts`:

```typescript
import type { Patient, Prisma } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface PatientsRepository {
  create(data: Prisma.PatientUncheckedCreateInput): Promise<Patient>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Patient | null>;
  findByLeadId(leadId: string): Promise<Patient | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<Patient>>;
  save(patient: Patient): Promise<Patient>;
}
```

E a implementação Prisma em `src/core/repositories/prisma/prisma-patients-repository.ts`.

---

## 6. Adaptar o Schema do Banco (opcional)

O `ScreeningReport.data` é um campo `Json` **livre por design** — cada instância persiste a estrutura que fizer sentido. Para a clínica médica:

```typescript
// O data persiste campos específicos do domínio médico:
data: {
  urgencyLevel: "Alta" | "Média" | "Baixa",
  recommendedSpecialty: "Cardiologia",
  notes: "Paciente relata dor no peito há 3 dias...",
}
```

Para a advocacia, o mesmo campo persiste:
```typescript
data: {
  viabilityLabel: "Alta" | "Moderada" | "Baixa",
  analysisText: "...",
  estimatedComplexity: "Simples" | "Média" | "Alta",
  mainLegalBase: "Art. 927 do CC...",
}
```

**Você não precisa alterar o schema** para mudar a estrutura de `data` — apenas a lógica do agente pós-triagem.

---

## 7. Registrar as Rotas da Instância no App

Se criou entidades específicas com controllers REST, registre em `src/app.ts`:

```typescript
// src/app.ts

// Adicionar imports das rotas da nova instância:
import { patientsRoutes } from "@/http/controllers/patients/routes";

// Adicionar registro:
app.register(patientsRoutes);
```

---

## 8. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | ✅ | `dev` ou `production` |
| `PORT` | ✅ | Porta do servidor (padrão: 3333) |
| `JWT_SECRET` | ✅ | Segredo para assinar tokens JWT |
| `DATABASE_URL` | ✅ | String de conexão PostgreSQL |
| `DATABASE_URL_EVOLUTION` | ✅ | String de conexão do banco da Evolution API |
| `DATABASE_SCHEMA` | ✅ | Schema do PostgreSQL (ex: `vero`) |
| `GEMINI_API_KEY` | ✅ | Chave da API Google Gemini |
| `EVOLUTION_API_URL` | ✅ | URL da Evolution API (WhatsApp) |
| `EVOLUTION_API_KEY` | ✅ | Chave de acesso da Evolution API |
| `EVOLUTION_INSTANCE_NAME` | ✅ | Nome da instância na Evolution API |
| `APP_URL` | ✅ | URL pública do servidor (para links de e-mail) |
| `EMAIL_FROM` | ✅ | E-mail remetente para recuperação de senha |
| `SMTP_HOST` | ✅ | Host SMTP |
| `SMTP_PORT` | ✅ | Porta SMTP |
| `SMTP_USER` | ✅ | Usuário SMTP |
| `SMTP_PASSWORD` | ✅ | Senha SMTP |
| `RESEND_API_KEY` | ⬜ | Alternativa ao SMTP (serviço Resend) |
| `GOOGLE_CLIENT_ID` | ⬜ | Apenas se usar integração Google Calendar |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Apenas se usar integração Google Calendar |
| `GOOGLE_OAUTH_REDIRECT_URI` | ⬜ | Apenas se usar integração Google Calendar |
| `GOOGLE_OAUTH_STATE_SECRET` | ⬜ | Apenas se usar integração Google Calendar |
| `GOOGLE_APPLICATION_CREDENTIALS` | ⬜ | Apenas se usar Google Docs/Drive |
| `GOOGLE_FOLDER_ID` | ⬜ | Apenas se usar Google Docs/Drive |

---

## 9. Checklist Final

Antes de rodar a nova instância, confirme cada item:

### Setup inicial
- [ ] Repositório clonado
- [ ] `pnpm install` executado
- [ ] `.env` preenchido com todas as variáveis obrigatórias
- [ ] `docker compose up -d` (banco + Redis rodando)
- [ ] `pnpm prisma migrate dev` executado
- [ ] `pnpm prisma generate` executado

### Limpeza da instância anterior
- [ ] `src/instance/` removido completamente
- [ ] `src/http/controllers/` removido completamente
- [ ] `src/app.ts` limpo (imports e registros da instância anterior removidos)
- [ ] Models do schema Prisma específicos da advocacia removidos (se não usados)

### Nova instância criada
- [ ] `IdentifierAgent` implementado (`gemini-identifier-agent.ts` + `identifier-prompt.ts`)
- [ ] `InterviewerAgent` implementado (`gemini-interviewer-agent.ts` + `interviewer-prompt.ts`)
- [ ] Agente pós-triagem implementado (equivalente ao `case-analyzer`)
- [ ] Hook pós-triagem implementado (`ProcessPostScreeningUseCase`)
- [ ] `InstanceConfig` criado em `src/instance/config/instance-config.ts`
  - [ ] `workspaceLabel` definido
  - [ ] `agents.identifier` e `agents.interviewer` configurados
  - [ ] `terminalStatuses` definido
  - [ ] Todos os status têm um handler em `statusHandlers`
  - [ ] `onStatusTransition["FORWARDED"]` registrado
- [ ] Import no `evolution.ts` atualizado para usar o novo config singleton

### Banco de dados
- [ ] Entidades específicas do domínio adicionadas ao schema (se necessário)
- [ ] `ScreeningFlows` criados no banco via API (pelo menos um por `caseType` do domínio)
- [ ] `Workspace` criado no banco via API
- [ ] Usuário admin criado via API

### Validação
- [ ] `pnpm run dev` inicia sem erros
- [ ] Webhook `/webhooks/evolution` responde `200`
- [ ] Ao enviar uma mensagem de teste, a sessão é criada no banco
- [ ] O agente identificador responde corretamente
- [ ] Após identificação, a sessão muda para `INTERVIEWING`
- [ ] O agente entrevistador conduz as perguntas do `ScreeningFlow`
- [ ] Ao concluir a triagem, a sessão muda para `FORWARDED`
- [ ] O `ScreeningReport` é criado no banco com os dados do domínio

---

## Referência Rápida: Mapa de Responsabilidades

```
src/
├── core/                          ← FRAMEWORK — nunca altere
│   ├── agents/ports/              ← Contratos (interfaces) dos agentes
│   ├── config/                    ← Contrato InstanceConfig
│   ├── controllers/               ← Controllers HTTP do core (webhook incluso)
│   ├── orchestrator/              ← Tipos StatusHandler, StatusTransition*
│   ├── repositories/              ← Interfaces de repositório do core
│   └── use-cases/                 ← Todos os use cases do framework
│
├── instance/                      ← SUA INSTÂNCIA — crie e adapte aqui
│   ├── agents/
│   │   ├── identifier/            ← Implementação do IdentifierAgent
│   │   ├── interviewer/           ← Implementação do InterviewerAgent
│   │   └── post-screening/        ← Agente de pós-triagem (opcional)
│   ├── config/
│   │   └── instance-config.ts     ← InstanceConfig da sua instância
│   ├── repositories/              ← Interfaces de repositórios da instância
│   └── use-cases/
│       └── post-screening/        ← Hook pós-triagem (onStatusTransition)
│
├── http/controllers/              ← Controllers REST da instância (opcional)
│   └── patients/                  ← Exemplo: rotas de pacientes
│
└── app.ts                         ← Registrar rotas da instância aqui
```
