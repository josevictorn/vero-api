# Vero API — Diagrama de Classes do Framework

> Este diagrama foca na distinção central da arquitetura:
> **pontos fixos** do framework (classes concretas que orquestram o fluxo) →
> **pontos flexíveis** (interfaces/ports que o framework define e consome) →
> **implementações concretas** da instância (subclasses e objetos que preenchem os contratos).

---

## Legenda

| Símbolo / Estereótipo | Significado |
|---|---|
| `<<core fixo>>` | Classe concreta do framework — não pode ser alterada pela instância |
| `<<interface — ponto flexível>>` | Interface do framework — a instância **deve** implementar |
| `<<instância concreta>>` | Implementação fornecida pela instância (escritório de advocacia) |
| `<<infra concreta>>` | Implementação de infraestrutura (Prisma, Redis, In-Memory) |
| `──►` (associação) | "usa / chama" de forma direta |
| `..►` (dependência) | "depende via injeção" |
| `<\|..` (realização) | "implementa a interface" |

---

## 1. Visão Central: Framework × Instância

O diagrama abaixo é o **coração da arquitetura**. Mostra o caminho completo desde o ponto de entrada (webhook) até as implementações concretas da instância, evidenciando onde o framework "chama" os pontos flexíveis.

```mermaid
classDiagram
    direction TB

    class EvolutionWebhookController {
        <<core fixo — ponto de entrada>>
        +handleWebhook(payload) void
        -filtraFromMe(payload) boolean
        -extraiTexto(payload) string
        -sendTextMessage(chatId, text) void
    }

    class HandleIncomingMessageUseCase {
        <<core fixo>>
        -getAiSession: GetAiSessionByChatIdUseCase
        -createAiSession: CreateAiSessionUseCase
        -createLead: CreateLeadUseCase
        -fetchWorkspaces: FetchWorkspacesUseCase
        -editAiSession: EditAiSessionUseCase
        -terminalStatuses: string[]
        +execute(request) Promise~Either~
    }

    class RouteMessageUseCase {
        <<core fixo>>
        -statusHandlers: StatusHandlerMap
        +execute(request) Promise~Either~
    }

    class ProcessMessageIdentifyingAgentUseCase {
        <<core fixo>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        -aiSessionRepository: AiSessionRepository
        -workspacesRepository: WorkspacesRepository
        -identifierAgent: IdentifierAgent
        -chatMemoryProvider: ChatMemoryPort
        -workspaceLabel: string
        -onStatusTransition?: StatusTransitionMap
        +execute(request) Promise~Either~
    }

    class ProcessInterviewInterviewerAgentUseCase {
        <<core fixo>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        -aiSessionRepository: AiSessionRepository
        -leadsRepository: LeadsRepository
        -interviewerAgent: InterviewerAgent
        -chatMemoryProvider: ChatMemoryPort
        -onStatusTransition?: StatusTransitionMap
        -domainEntityPort?: DomainEntityPort
        +execute(request) Promise~Either~
    }

    class InstanceConfig {
        <<interface — ponto flexível>>
        +workspaceLabel: string
        +agents: AgentsConfig
        +terminalStatuses: string[]
        +statusHandlers: StatusHandlerMap
        +onStatusTransition?: StatusTransitionMap
        +domainEntity?: DomainEntityPort
    }

    class IdentifierAgent {
        <<interface — ponto flexível>>
        +identify(input: IdentifierAgentInput) Promise~Either~
    }

    class InterviewerAgent {
        <<interface — ponto flexível>>
        +interview(input: InterviewerAgentInput) Promise~Either~
    }

    class ChatMemoryPort {
        <<interface — ponto flexível>>
        +getHistory(key: string) Promise~ChatMessage[]~
        +saveHistory(key: string, messages) Promise~void~
        +clear(key: string) Promise~void~
    }

    class DomainEntityPort {
        <<interface — ponto flexível>>
        +entityTag: string
        +createFromScreening(input) Promise~Either~
        +findById(id) Promise~DomainEntity?~
        +findByLeadId(leadId) Promise~DomainEntity?~
        +findMany(params) Promise~PaginatedResult~
        +update(id, data) Promise~Either~
        +delete(id) Promise~void~
    }

    class LawFirmInstanceConfig {
        <<instância concreta>>
        +workspaceLabel: "escritório de advocacia"
        +terminalStatuses: ["BOOKED"]
        +statusHandlers: IDENTIFYING, INTERVIEWING, FORWARDED, BOOKING, BOOKED
        +onStatusTransition: FORWARDED → ProcessScreeningAnalyzerAgentUseCase
        +domainEntity: LawFirmDomainEntityPort
    }

    class GeminiIdentifierAgent {
        <<instância concreta>>
        -model: GenerativeModel
        +identify(input) Promise~Either~
    }

    class GeminiInterviewerAgent {
        <<instância concreta>>
        -model: GenerativeModel
        +interview(input) Promise~Either~
    }

    class LawFirmDomainEntityPort {
        <<instância concreta>>
        +entityTag: "clients"
        -clientsRepository: ClientsRepository
        +createFromScreening(input) Promise~Either~
        +findById(id) Promise~DomainEntity?~
        +findByLeadId(leadId) Promise~DomainEntity?~
        +findMany(params) Promise~PaginatedResult~
        +update(id, data) Promise~Either~
        +delete(id) Promise~void~
    }

    class ProcessScreeningAnalyzerAgentUseCase {
        <<instância concreta — hook FORWARDED>>
        -caseAnalyzerAgent: GeminiCaseAnalyzerAgent
        -screeningReportRepository: ScreeningReportRepository
        +execute(ctx: StatusTransitionContext) Promise~void~
    }

    class GeminiCaseAnalyzerAgent {
        <<instância concreta>>
        -model: GenerativeModel
        +analyze(input) Promise~Either~
    }

    class RedisChatMemoryProvider {
        <<infra concreta>>
        +getHistory(key) Promise~ChatMessage[]~
        +saveHistory(key, messages) Promise~void~
        +clear(key) Promise~void~
    }

    EvolutionWebhookController --> HandleIncomingMessageUseCase : cria via factory
    EvolutionWebhookController --> RouteMessageUseCase : cria via factory
    EvolutionWebhookController ..> InstanceConfig : injeta config nas factories

    HandleIncomingMessageUseCase ..> InstanceConfig : consome terminalStatuses
    RouteMessageUseCase ..> InstanceConfig : consome statusHandlers

    RouteMessageUseCase ..> ProcessMessageIdentifyingAgentUseCase : delega via statusHandlers IDENTIFYING
    RouteMessageUseCase ..> ProcessInterviewInterviewerAgentUseCase : delega via statusHandlers INTERVIEWING

    ProcessMessageIdentifyingAgentUseCase --> IdentifierAgent : chama via interface
    ProcessMessageIdentifyingAgentUseCase --> ChatMemoryPort : usa via interface
    ProcessMessageIdentifyingAgentUseCase ..> InstanceConfig : consome workspaceLabel e onStatusTransition

    ProcessInterviewInterviewerAgentUseCase --> InterviewerAgent : chama via interface
    ProcessInterviewInterviewerAgentUseCase --> ChatMemoryPort : usa via interface
    ProcessInterviewInterviewerAgentUseCase --> DomainEntityPort : chama createFromScreening
    ProcessInterviewInterviewerAgentUseCase ..> InstanceConfig : consome onStatusTransition

    InstanceConfig <|.. LawFirmInstanceConfig : implementa
    IdentifierAgent <|.. GeminiIdentifierAgent : implementa
    InterviewerAgent <|.. GeminiInterviewerAgent : implementa
    ChatMemoryPort <|.. RedisChatMemoryProvider : implementa
    DomainEntityPort <|.. LawFirmDomainEntityPort : implementa

    LawFirmInstanceConfig ..> ProcessScreeningAnalyzerAgentUseCase : registra em onStatusTransition FORWARDED
    ProcessScreeningAnalyzerAgentUseCase --> GeminiCaseAnalyzerAgent : usa
```

---

## 2. Repositórios: Interfaces (pontos fixos) × Implementações

O framework define interfaces de repositório que os use cases do core dependem exclusivamente delas. As implementações Prisma e In-Memory são os pontos de variação de infraestrutura.

```mermaid
classDiagram
    direction LR

    class UsersRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~User~
        +findByEmail(email) Promise~User?~
        +findById(id) Promise~User?~
        +findMany(params) Promise~PaginatedResult~
        +save(user) Promise~User~
    }

    class WorkspacesRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~Workspace~
        +delete(id) Promise~void~
        +findByCnpj(cnpj) Promise~Workspace?~
        +findById(id) Promise~Workspace?~
        +findFirst() Promise~Workspace?~
        +findMany(params) Promise~PaginatedResult~
        +save(workspace) Promise~Workspace~
    }

    class LeadsRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~Lead~
        +delete(id) Promise~void~
        +findById(id) Promise~Lead?~
        +findMany(params) Promise~PaginatedResult~
        +save(lead) Promise~Lead~
    }

    class ScreeningFlowsRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~ScreeningFlow~
        +delete(id) Promise~void~
        +findById(id) Promise~ScreeningFlow?~
        +findMany(params) Promise~PaginatedResult~
        +save(flow) Promise~ScreeningFlow~
    }

    class AiSessionRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~AiSession~
        +delete(id) Promise~void~
        +findById(id) Promise~AiSession?~
        +findByChatId(chatId) Promise~AiSession?~
        +findMany(params) Promise~PaginatedResult~
        +save(session) Promise~AiSession~
    }

    class ScreeningReportRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~ScreeningReport~
        +delete(id) Promise~void~
        +findById(id) Promise~ScreeningReport?~
        +findMany(params) Promise~PaginatedResult~
        +save(report) Promise~ScreeningReport~
    }

    class PasswordResetTokensRepository {
        <<interface — ponto fixo>>
        +create(data) Promise~PasswordResetToken~
        +findByToken(token) Promise~PasswordResetToken?~
        +deleteByUserId(userId) Promise~void~
        +markAsUsed(id) Promise~PasswordResetToken~
    }

    class PrismaUsersRepository { <<infra concreta>> }
    class PrismaWorkspacesRepository { <<infra concreta>> }
    class PrismaLeadsRepository { <<infra concreta>> }
    class PrismaScreeningFlowsRepository { <<infra concreta>> }
    class PrismaAiSessionRepository { <<infra concreta>> }
    class PrismaScreeningReportRepository { <<infra concreta>> }

    class InMemoryUsersRepository { <<infra concreta — testes>> }
    class InMemoryWorkspacesRepository { <<infra concreta — testes>> }
    class InMemoryLeadsRepository { <<infra concreta — testes>> }
    class InMemoryScreeningFlowsRepository { <<infra concreta — testes>> }
    class InMemoryAiSessionRepository { <<infra concreta — testes>> }
    class InMemoryScreeningReportRepository { <<infra concreta — testes>> }

    UsersRepository <|.. PrismaUsersRepository
    UsersRepository <|.. InMemoryUsersRepository

    WorkspacesRepository <|.. PrismaWorkspacesRepository
    WorkspacesRepository <|.. InMemoryWorkspacesRepository

    LeadsRepository <|.. PrismaLeadsRepository
    LeadsRepository <|.. InMemoryLeadsRepository

    ScreeningFlowsRepository <|.. PrismaScreeningFlowsRepository
    ScreeningFlowsRepository <|.. InMemoryScreeningFlowsRepository

    AiSessionRepository <|.. PrismaAiSessionRepository
    AiSessionRepository <|.. InMemoryAiSessionRepository

    ScreeningReportRepository <|.. PrismaScreeningReportRepository
    ScreeningReportRepository <|.. InMemoryScreeningReportRepository
```

---

## 3. Use Cases do Core: Pontos Fixos que Dependem dos Repositórios

Os use cases do core são pontos fixos implementados pelo framework e reutilizados por qualquer instância. Eles dependem exclusivamente das interfaces de repositório.

```mermaid
classDiagram
    direction TB

    class HandleIncomingMessageUseCase {
        <<core fixo — orquestração>>
        -getAiSession: GetAiSessionByChatIdUseCase
        -createAiSession: CreateAiSessionUseCase
        -createLead: CreateLeadUseCase
        -fetchWorkspaces: FetchWorkspacesUseCase
        -editAiSession: EditAiSessionUseCase
        -terminalStatuses: string[]
        +execute(request) Promise~Either~
    }

    class RouteMessageUseCase {
        <<core fixo — orquestração>>
        -statusHandlers: StatusHandlerMap
        +execute(request) Promise~Either~
    }

    class ProcessMessageIdentifyingAgentUseCase {
        <<core fixo — orquestração>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        -aiSessionRepository: AiSessionRepository
        -workspacesRepository: WorkspacesRepository
        -identifierAgent: IdentifierAgent
        -chatMemoryProvider: ChatMemoryPort
        -workspaceLabel: string
        -onStatusTransition?: StatusTransitionMap
        +execute(request) Promise~Either~
    }

    class ProcessInterviewInterviewerAgentUseCase {
        <<core fixo — orquestração>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        -aiSessionRepository: AiSessionRepository
        -leadsRepository: LeadsRepository
        -interviewerAgent: InterviewerAgent
        -chatMemoryProvider: ChatMemoryPort
        -onStatusTransition?: StatusTransitionMap
        -domainEntityPort?: DomainEntityPort
        +execute(request) Promise~Either~
    }

    class RegisterUserUseCase {
        <<core fixo — domínio>>
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class AuthenticateUseCase {
        <<core fixo — domínio>>
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class ForgotPasswordUseCase {
        <<core fixo — domínio>>
        -usersRepository: UsersRepository
        -passwordResetTokensRepository: PasswordResetTokensRepository
        -emailSender: MailSender
        +execute(request) Promise~Either~
    }

    class CreateLeadUseCase {
        <<core fixo — domínio>>
        -leadsRepository: LeadsRepository
        -workspacesRepository: WorkspacesRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class EditLeadUseCase {
        <<core fixo — domínio>>
        -leadsRepository: LeadsRepository
        -workspacesRepository: WorkspacesRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class FetchLeadsUseCase {
        <<core fixo — domínio>>
        -leadsRepository: LeadsRepository
        +execute(request) Promise~Either~
    }

    class CreateScreeningFlowUseCase {
        <<core fixo — domínio>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }
    class FetchScreeningFlowsUseCase {
        <<core fixo — domínio>>
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }

    class CreateAiSessionUseCase {
        <<core fixo — domínio>>
        -aiSessionRepository: AiSessionRepository
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }
    class EditAiSessionUseCase {
        <<core fixo — domínio>>
        -aiSessionRepository: AiSessionRepository
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }
    class GetAiSessionByChatIdUseCase {
        <<core fixo — domínio>>
        -aiSessionRepository: AiSessionRepository
        +execute(request) Promise~Either~
    }

    class CreateScreeningReportUseCase {
        <<core fixo — domínio>>
        -screeningReportRepository: ScreeningReportRepository
        -aiSessionRepository: AiSessionRepository
        +execute(request) Promise~Either~
    }

    class GetDomainEntityUseCase {
        <<core fixo — domínio genérico>>
        -domainEntityPort: DomainEntityPort
        +execute(request) Promise~Either~
    }
    class FetchDomainEntitiesUseCase {
        <<core fixo — domínio genérico>>
        -domainEntityPort: DomainEntityPort
        +execute(request) Promise~Either~
    }
    class UpdateDomainEntityUseCase {
        <<core fixo — domínio genérico>>
        -domainEntityPort: DomainEntityPort
        +execute(request) Promise~Either~
    }
    class DeleteDomainEntityUseCase {
        <<core fixo — domínio genérico>>
        -domainEntityPort: DomainEntityPort
        +execute(request) Promise~Either~
    }

    class UsersRepository { <<interface — ponto fixo>> }
    class LeadsRepository { <<interface — ponto fixo>> }
    class WorkspacesRepository { <<interface — ponto fixo>> }
    class AiSessionRepository { <<interface — ponto fixo>> }
    class ScreeningFlowsRepository { <<interface — ponto fixo>> }
    class ScreeningReportRepository { <<interface — ponto fixo>> }
    class PasswordResetTokensRepository { <<interface — ponto fixo>> }
    class MailSender { <<interface — ponto fixo>> }
    class IdentifierAgent { <<interface — ponto flexível>> }
    class InterviewerAgent { <<interface — ponto flexível>> }
    class ChatMemoryPort { <<interface — ponto flexível>> }
    class DomainEntityPort { <<interface — ponto flexível>> }

    HandleIncomingMessageUseCase --> GetAiSessionByChatIdUseCase
    HandleIncomingMessageUseCase --> CreateAiSessionUseCase
    HandleIncomingMessageUseCase --> CreateLeadUseCase
    HandleIncomingMessageUseCase --> EditAiSessionUseCase

    RouteMessageUseCase ..> ProcessMessageIdentifyingAgentUseCase : delega via handler
    RouteMessageUseCase ..> ProcessInterviewInterviewerAgentUseCase : delega via handler

    ProcessMessageIdentifyingAgentUseCase --> ScreeningFlowsRepository
    ProcessMessageIdentifyingAgentUseCase --> AiSessionRepository
    ProcessMessageIdentifyingAgentUseCase --> WorkspacesRepository
    ProcessMessageIdentifyingAgentUseCase --> IdentifierAgent : chama via interface
    ProcessMessageIdentifyingAgentUseCase --> ChatMemoryPort : usa via interface

    ProcessInterviewInterviewerAgentUseCase --> ScreeningFlowsRepository
    ProcessInterviewInterviewerAgentUseCase --> AiSessionRepository
    ProcessInterviewInterviewerAgentUseCase --> LeadsRepository
    ProcessInterviewInterviewerAgentUseCase --> InterviewerAgent : chama via interface
    ProcessInterviewInterviewerAgentUseCase --> ChatMemoryPort : usa via interface
    ProcessInterviewInterviewerAgentUseCase --> DomainEntityPort : chama createFromScreening

    RegisterUserUseCase --> UsersRepository
    AuthenticateUseCase --> UsersRepository
    ForgotPasswordUseCase --> UsersRepository
    ForgotPasswordUseCase --> PasswordResetTokensRepository
    ForgotPasswordUseCase --> MailSender

    CreateLeadUseCase --> LeadsRepository
    CreateLeadUseCase --> WorkspacesRepository
    CreateLeadUseCase --> UsersRepository
    EditLeadUseCase --> LeadsRepository
    FetchLeadsUseCase --> LeadsRepository

    CreateScreeningFlowUseCase --> ScreeningFlowsRepository
    FetchScreeningFlowsUseCase --> ScreeningFlowsRepository

    CreateAiSessionUseCase --> AiSessionRepository
    CreateAiSessionUseCase --> ScreeningFlowsRepository
    EditAiSessionUseCase --> AiSessionRepository
    GetAiSessionByChatIdUseCase --> AiSessionRepository

    CreateScreeningReportUseCase --> ScreeningReportRepository
    CreateScreeningReportUseCase --> AiSessionRepository

    GetDomainEntityUseCase --> DomainEntityPort
    FetchDomainEntitiesUseCase --> DomainEntityPort
    UpdateDomainEntityUseCase --> DomainEntityPort
    DeleteDomainEntityUseCase --> DomainEntityPort
```

---

## 4. Resumo: Quem Chama Quem (Fluxo Completo)

```mermaid
flowchart TD
    subgraph ENTRADA["🔒 Ponto de Entrada — Core Fixo"]
        WH["EvolutionWebhookController"]
    end

    subgraph ORQUESTRACAO["🔒 Orquestração — Core Fixo"]
        HIM["HandleIncomingMessageUseCase"]
        RM["RouteMessageUseCase"]
        PIA["ProcessMessageIdentifyingAgentUseCase"]
        PIV["ProcessInterviewInterviewerAgentUseCase"]
    end

    subgraph CONTRATOS["🔓 Pontos Flexíveis — Interfaces"]
        IC["InstanceConfig"]
        IA["IdentifierAgent"]
        IV["InterviewerAgent"]
        CM["ChatMemoryPort"]
        DE["DomainEntityPort"]
    end

    subgraph INSTANCIA["🟢 Implementações — Instância Concreta"]
        LF["LawFirmInstanceConfig"]
        GIA["GeminiIdentifierAgent"]
        GIV["GeminiInterviewerAgent"]
        RD["RedisChatMemoryProvider"]
        LFD["LawFirmDomainEntityPort"]
        PSA["ProcessScreeningAnalyzerAgentUseCase"]
        GCA["GeminiCaseAnalyzerAgent"]
    end

    WH -->|"cria via factory + injeta"| IC
    WH --> HIM
    WH --> RM

    HIM -->|"consome terminalStatuses"| IC
    RM -->|"consome statusHandlers"| IC

    RM -->|"delega IDENTIFYING"| PIA
    RM -->|"delega INTERVIEWING"| PIV

    PIA -->|"chama via interface"| IA
    PIA -->|"usa via interface"| CM
    PIA -->|"consome workspaceLabel + hooks"| IC

    PIV -->|"chama via interface"| IV
    PIV -->|"usa via interface"| CM
    PIV -->|"chama createFromScreening"| DE
    PIV -->|"dispara onStatusTransition"| IC

    IC -.->|"implementa"| LF
    IA -.->|"implementa"| GIA
    IV -.->|"implementa"| GIV
    CM -.->|"implementa"| RD
    DE -.->|"implementa"| LFD

    LF -->|"registra hook FORWARDED"| PSA
    PSA --> GCA

    style ENTRADA fill:#1a1a2e,color:#e0e0ff,stroke:#6c63ff
    style ORQUESTRACAO fill:#16213e,color:#e0e0ff,stroke:#4aaeff
    style CONTRATOS fill:#0f3460,color:#e0ffff,stroke:#00d4ff
    style INSTANCIA fill:#1b4332,color:#d8f3dc,stroke:#52b788
```

---

## 5. Tabela de Correspondência: Fixo × Flexível × Concreto

| Ponto Fixo (framework) | Ponto Flexível (interface) | Implementação Concreta (instância) |
|---|---|---|
| `EvolutionWebhookController` | `InstanceConfig` | `LawFirmInstanceConfig` |
| `ProcessMessageIdentifyingAgentUseCase` | `IdentifierAgent` | `GeminiIdentifierAgent` |
| `ProcessInterviewInterviewerAgentUseCase` | `InterviewerAgent` | `GeminiInterviewerAgent` |
| `ProcessMessageIdentifyingAgentUseCase` + `ProcessInterviewInterviewerAgentUseCase` | `ChatMemoryPort` | `RedisChatMemoryProvider` |
| `ProcessInterviewInterviewerAgentUseCase` + use cases genéricos `/entities` | `DomainEntityPort` | `LawFirmDomainEntityPort` |
| `ProcessInterviewInterviewerAgentUseCase` (hook FORWARDED) | `StatusTransitionMap` | `ProcessScreeningAnalyzerAgentUseCase` |
| `HandleIncomingMessageUseCase` | `terminalStatuses: string[]` | `["BOOKED"]` |
| `RouteMessageUseCase` | `statusHandlers: StatusHandlerMap` | `{IDENTIFYING, INTERVIEWING, FORWARDED, BOOKING, BOOKED}` |
| Todos os use cases de domínio do core | `UsersRepository` | `PrismaUsersRepository` / `InMemoryUsersRepository` |
| Todos os use cases de domínio do core | `LeadsRepository` | `PrismaLeadsRepository` / `InMemoryLeadsRepository` |
| Todos os use cases de domínio do core | `AiSessionRepository` | `PrismaAiSessionRepository` / `InMemoryAiSessionRepository` |
| Todos os use cases de domínio do core | `ScreeningFlowsRepository` | `PrismaScreeningFlowsRepository` / `InMemoryScreeningFlowsRepository` |
| Todos os use cases de domínio do core | `ScreeningReportRepository` | `PrismaScreeningReportRepository` / `InMemoryScreeningReportRepository` |
