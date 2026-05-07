# Vero API — Diagrama de Classes (Mermaid)

## 1. Diagrama de Entidades (Models Prisma)

```mermaid
classDiagram
    direction LR

    class Role {
        <<enumeration>>
        ADMIN
        LAWYER
        ASSISTANT
    }

    class User {
        +String id
        +String name
        +String email
        +String password_hash
        +Role role
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Workspace {
        +String id
        +String name
        +String cnpj
        +String email
        +String cellphone
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Lawyer {
        +String id
        +String userId
        +String workspaceId
        +String cellphone
        +String name
        +String oab
        +String oabState
        +String pix
        +DateTime createdAt
    }

    class Lead {
        +String id
        +String workspaceId
        +String? lawyerId
        +String name
        +String cellphone
        +String email
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Client {
        +String id
        +String name
        +String maritalStatus
        +String profession
        +String rg
        +String issuingAgency
        +String cpf
        +String street
        +String neighborhood
        +String city
        +String state
        +String zipCode
        +String email
        +String cellphone
        +String workspaceId
        +String? lawyerId
        +String? createdFromLeadId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class ScreeningFlow {
        +String id
        +String caseType
        +String? lawyerId
        +Json questions
        +DateTime createdAt
    }

    class AiSession {
        +String id
        +String? screeningFlowId
        +String chatId
        +String status
        +Json chatState
        +String name
        +String cellphone
        +Boolean isThirdParty
        +DateTime createdAt
    }

    class CaseAnalysis {
        +String id
        +String aiSessionId
        +String leadId
        +String title
        +String viabilityLabel
        +String analysisText
        +String estimatedComplexity
        +String mainLegalBase
        +DateTime createdAt
    }

    class GoogleCalendarConnection {
        +String id
        +String userId
        +String googleEmail
        +String accessToken
        +String refreshToken
        +DateTime tokenExpiresAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class CalendarEvent {
        +String id
        +String userId
        +String googleEventId
        +String summary
        +String? description
        +DateTime startsAt
        +DateTime endsAt
        +String? hangoutLink
        +DateTime createdAt
        +DateTime updatedAt
    }

    User "1" --> "1" Role
    User "1" --> "0..1" Lawyer
    User "1" --> "0..1" GoogleCalendarConnection
    User "1" --> "0..*" CalendarEvent

    Workspace "1" --> "0..*" Lawyer
    Workspace "1" --> "0..*" Lead
    Workspace "1" --> "0..*" Client

    Lawyer "1" --> "1" User
    Lawyer "1" --> "1" Workspace
    Lawyer "1" --> "0..*" Lead
    Lawyer "1" --> "0..*" Client

    Lead "1" --> "1" Workspace
    Lead "0..1" --> "0..1" Lawyer
    Lead "1" --> "0..*" CaseAnalysis
    Lead "1" --> "0..1" Client : LeadToClient

    Client "1" --> "1" Workspace
    Client "0..1" --> "0..1" Lawyer
    Client "0..1" --> "0..1" Lead : LeadToClient

    ScreeningFlow "1" --> "0..*" AiSession
    AiSession "1" --> "0..1" ScreeningFlow
    AiSession "1" --> "0..*" CaseAnalysis

    CaseAnalysis "1" --> "1" AiSession
    CaseAnalysis "1" --> "1" Lead

    GoogleCalendarConnection "1" --> "1" User
    CalendarEvent "1" --> "1" User
```

---

## 2. Diagrama de Repository Interfaces + Implementações

```mermaid
classDiagram
    direction TB

    class UsersRepository {
        <<interface>>
        +create(data) Promise~User~
        +findByEmail(email) Promise~User?~
        +findById(id) Promise~User?~
        +findMany(params) Promise~PaginatedResult~
        +save(user) Promise~User~
    }
    class PrismaUsersRepository {
        +create(data) Promise~User~
        +findByEmail(email) Promise~User?~
        +findById(id) Promise~User?~
        +findMany(params) Promise~PaginatedResult~
        +save(user) Promise~User~
    }
    class InMemoryUsersRepository {
        -items: User[]
        +create(data) Promise~User~
        +findByEmail(email) Promise~User?~
        +findById(id) Promise~User?~
        +findMany(params) Promise~PaginatedResult~
        +save(user) Promise~User~
    }
    UsersRepository <|.. PrismaUsersRepository
    UsersRepository <|.. InMemoryUsersRepository

    class WorkspacesRepository {
        <<interface>>
        +create(data) Promise~Workspace~
        +delete(id) Promise~void~
        +findByCnpj(cnpj) Promise~Workspace?~
        +findById(id) Promise~Workspace?~
        +findMany(params) Promise~PaginatedResult~
        +save(workspace) Promise~Workspace~
    }
    class PrismaWorkspacesRepository
    class InMemoryWorkspacesRepository
    WorkspacesRepository <|.. PrismaWorkspacesRepository
    WorkspacesRepository <|.. InMemoryWorkspacesRepository

    class LawyersRepository {
        <<interface>>
        +create(data) Promise~Lawyer~
        +delete(id) Promise~void~
        +findById(id) Promise~Lawyer?~
        +findByUserId(userId) Promise~Lawyer?~
        +findMany(params) Promise~PaginatedResult~
        +save(lawyer) Promise~Lawyer~
    }
    class PrismaLawyersRepository
    class InMemoryLawyersRepository
    LawyersRepository <|.. PrismaLawyersRepository
    LawyersRepository <|.. InMemoryLawyersRepository

    class LeadsRepository {
        <<interface>>
        +create(data) Promise~Lead~
        +delete(id) Promise~void~
        +findById(id) Promise~Lead?~
        +findMany(params) Promise~PaginatedResult~
        +save(lead) Promise~Lead~
    }
    class PrismaLeadsRepository
    class InMemoryLeadsRepository
    LeadsRepository <|.. PrismaLeadsRepository
    LeadsRepository <|.. InMemoryLeadsRepository

    class ClientsRepository {
        <<interface>>
        +create(data) Promise~Client~
        +delete(id) Promise~void~
        +findById(id) Promise~Client?~
        +findByLeadId(leadId) Promise~Client?~
        +findMany(params) Promise~PaginatedResult~
        +save(client) Promise~Client~
    }
    class PrismaClientsRepository
    class InMemoryClientsRepository
    ClientsRepository <|.. PrismaClientsRepository
    ClientsRepository <|.. InMemoryClientsRepository

    class ScreeningFlowsRepository {
        <<interface>>
        +create(data) Promise~ScreeningFlow~
        +delete(id) Promise~void~
        +findById(id) Promise~ScreeningFlow?~
        +findMany(params) Promise~PaginatedResult~
        +save(sf) Promise~ScreeningFlow~
    }
    class PrismaScreeningFlowsRepository
    class InMemoryScreeningFlowsRepository
    ScreeningFlowsRepository <|.. PrismaScreeningFlowsRepository
    ScreeningFlowsRepository <|.. InMemoryScreeningFlowsRepository

    class AiSessionRepository {
        <<interface>>
        +create(data) Promise~AiSession~
        +delete(id) Promise~void~
        +findById(id) Promise~AiSession?~
        +findMany(params) Promise~PaginatedResult~
        +save(session) Promise~AiSession~
    }
    class PrismaAiSessionRepository
    class InMemoryAiSessionRepository
    AiSessionRepository <|.. PrismaAiSessionRepository
    AiSessionRepository <|.. InMemoryAiSessionRepository

    class CaseAnalysisRepository {
        <<interface>>
        +create(data) Promise~CaseAnalysis~
        +delete(id) Promise~void~
        +findById(id) Promise~CaseAnalysis?~
        +findMany(params) Promise~PaginatedResult~
        +save(ca) Promise~CaseAnalysis~
    }
    class PrismaCaseAnalysisRepository
    class InMemoryCaseAnalysisRepository
    CaseAnalysisRepository <|.. PrismaCaseAnalysisRepository
    CaseAnalysisRepository <|.. InMemoryCaseAnalysisRepository

    class CalendarConnectionsRepository {
        <<interface>>
        +deleteByUserId(userId) Promise~void~
        +findByUserId(userId) Promise~Connection?~
        +upsertByUserId(userId, data) Promise~Connection~
    }
    class PrismaCalendarConnectionsRepository
    class InMemoryCalendarConnectionsRepository
    CalendarConnectionsRepository <|.. PrismaCalendarConnectionsRepository
    CalendarConnectionsRepository <|.. InMemoryCalendarConnectionsRepository

    class CalendarEventsRepository {
        <<interface>>
        +deleteByGoogleEventId(userId, eventId) Promise~void~
        +upsertByGoogleEventId(userId, eventId, data) Promise~CalendarEvent~
    }
    class PrismaCalendarEventsRepository
    class InMemoryCalendarEventsRepository
    CalendarEventsRepository <|.. PrismaCalendarEventsRepository
    CalendarEventsRepository <|.. InMemoryCalendarEventsRepository
```

---

## 3. Diagrama de Use Cases e Dependências

```mermaid
classDiagram
    direction TB

    %% ── Users ──
    class RegisterUserUseCase {
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class AuthenticateUseCase {
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class GetUserProfileUseCase {
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class EditUserUseCase {
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class FetchUsersUseCase {
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }

    %% ── Workspaces ──
    class CreateWorkspaceUseCase {
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class EditWorkspaceUseCase {
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class DeleteWorkspaceUseCase {
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class FetchWorkspacesUseCase {
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class GetWorkspaceUseCase {
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }

    %% ── Lawyers ──
    class CreateLawyerUseCase {
        -lawyersRepository: LawyersRepository
        -usersRepository: UsersRepository
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class EditLawyerUseCase {
        -lawyersRepository: LawyersRepository
        -usersRepository: UsersRepository
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class DeleteLawyerUseCase {
        -lawyersRepository: LawyersRepository
        +execute(request) Promise~Either~
    }
    class FetchLawyersUseCase {
        -lawyersRepository: LawyersRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class GetLawyerUseCase {
        -lawyersRepository: LawyersRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }

    %% ── Leads ──
    class CreateLeadUseCase {
        -leadsRepository: LeadsRepository
        -workspacesRepository: WorkspacesRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class EditLeadUseCase {
        -leadsRepository: LeadsRepository
        -workspacesRepository: WorkspacesRepository
        -usersRepository: UsersRepository
        +execute(request) Promise~Either~
    }
    class DeleteLeadUseCase {
        -leadsRepository: LeadsRepository
        +execute(request) Promise~Either~
    }
    class FetchLeadsUseCase {
        -leadsRepository: LeadsRepository
        +execute(request) Promise~Either~
    }
    class GetLeadUseCase {
        -leadsRepository: LeadsRepository
        +execute(request) Promise~Either~
    }

    %% ── Clients ──
    class CreateClientUseCase {
        -clientsRepository: ClientsRepository
        -workspacesRepository: WorkspacesRepository
        -lawyersRepository: LawyersRepository
        +execute(request) Promise~Either~
    }
    class EditClientUseCase {
        -clientsRepository: ClientsRepository
        -lawyersRepository: LawyersRepository
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class DeleteClientUseCase {
        -clientsRepository: ClientsRepository
        +execute(request) Promise~Either~
    }
    class FetchClientsUseCase {
        -clientsRepository: ClientsRepository
        +execute(request) Promise~Either~
    }
    class GetClientUseCase {
        -clientsRepository: ClientsRepository
        +execute(request) Promise~Either~
    }
    class ConvertLeadToClientUseCase {
        -leadsRepository: LeadsRepository
        -clientsRepository: ClientsRepository
        -workspacesRepository: WorkspacesRepository
        +execute(request) Promise~Either~
    }
    class GenerateContractUseCase {
        -clientsRepository: ClientsRepository
        -lawyersRepository: LawyersRepository
        -workspacesRepository: WorkspacesRepository
        -driveDocsGateway: DriveDocsGateway
        -calendarConnectionsRepo: CalendarConnectionsRepository
        -calendarGateway: CalendarGateway
        +execute(request) Promise~Either~
    }

    %% ── Calendar ──
    class GenerateGoogleAuthUrlUseCase {
        -calendarGateway: CalendarGateway
        -oauthStateSigner: GoogleOAuthStateSigner
        +execute(request) Promise~Either~
    }
    class ConnectGoogleCalendarUseCase {
        -oauthStateSigner: GoogleOAuthStateSigner
        -calendarGateway: CalendarGateway
        -calendarConnectionsRepo: CalendarConnectionsRepository
        +execute(request) Promise~Either~
    }
    class DisconnectGoogleCalendarUseCase {
        -calendarConnectionsRepo: CalendarConnectionsRepository
        +execute(request) Promise~Either~
    }
    class CreateCalendarEventWithMeetUseCase {
        -calendarConnectionsRepo: CalendarConnectionsRepository
        -calendarEventsRepo: CalendarEventsRepository
        -calendarGateway: CalendarGateway
        +execute(request) Promise~Either~
    }

    %% ── AI / Screening ──
    class CreateAiSessionUseCase {
        -aiSessionRepository: AiSessionRepository
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }
    class CreateCaseAnalysisUseCase {
        -aiSessionRepository: AiSessionRepository
        -caseAnalysisRepository: CaseAnalysisRepository
        +execute(request) Promise~Either~
    }
    class CreateScreeningFlowUseCase {
        -screeningFlowsRepository: ScreeningFlowsRepository
        +execute(request) Promise~Either~
    }
```

---

## 4. Diagrama de Infraestrutura (Gateways)

```mermaid
classDiagram
    direction TB

    class CalendarGateway {
        <<interface>>
        +createEventWithMeet(input) Promise~Event~
        +deleteEvent(token, id) Promise~void~
        +exchangeCodeForTokens(code) Promise~TokenPayload~
        +getAuthUrl(state) string
        +getEvent(token, id) Promise~Event?~
        +getProfile(token) Promise~GoogleProfile~
        +listEvents(input) Promise~Event[]~
        +refreshAccessToken(token) Promise~TokenPayload~
        +updateEvent(input) Promise~Event?~
    }

    class GoogleCalendarGateway {
        -oauthClient: OAuth2Client
        +createEventWithMeet(input) Promise~Event~
        +deleteEvent(token, id) Promise~void~
        +exchangeCodeForTokens(code) Promise~TokenPayload~
        +getAuthUrl(state) string
        +getEvent(token, id) Promise~Event?~
        +getProfile(token) Promise~GoogleProfile~
        +listEvents(input) Promise~Event[]~
        +refreshAccessToken(token) Promise~TokenPayload~
        +updateEvent(input) Promise~Event?~
        -getCalendarClient(token) calendar
        -toGatewayEvent(event) CalendarGatewayEvent
    }

    class DriveDocsGateway {
        <<interface>>
        +copyTemplateAndReplace(input) Promise~Result~
    }

    class GoogleDriveDocsGateway {
        +copyTemplateAndReplace(input) Promise~Result~
        -getOAuthClient(token) OAuth2Client
    }

    class GoogleOAuthStateSigner {
        -secret: string
        +sign(payload) string
        +verify(state) object?
        -createSignature(data) string
    }

    CalendarGateway <|.. GoogleCalendarGateway
    DriveDocsGateway <|.. GoogleDriveDocsGateway
```

---

## 5. Diagrama de Utilities

```mermaid
classDiagram
    class Left~L, R~ {
        +readonly value: L
        +isRight() boolean
        +isLeft() boolean
    }
    class Right~L, R~ {
        +readonly value: R
        +isRight() boolean
        +isLeft() boolean
    }
    class PaginatedResult~T~ {
        <<interface>>
        +items: T[]
        +total: number
    }
    class PaginationParams {
        <<interface>>
        +page: number
    }
```
