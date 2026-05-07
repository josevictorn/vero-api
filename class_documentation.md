# Vero API — Documentação Completa de Classes

> Aplicação Node.js/TypeScript com Fastify, Prisma e Clean Architecture.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral)
2. [Models / Entidades (Prisma)](#2-models)
3. [Repository Interfaces](#3-repository-interfaces)
4. [Repository Implementations](#4-repository-implementations)
5. [Use Cases por Módulo](#5-use-cases)
6. [Classes de Erro](#6-error-classes)
7. [Infraestrutura (Gateways)](#7-infrastructure)
8. [Utilities](#8-utilities)
9. [Factories](#9-factories)
10. [HTTP Layer](#10-http-layer)

---

## 1. Visão Geral

A Vero API segue **Clean Architecture** com as seguintes camadas:

| Camada | Diretório | Responsabilidade |
|--------|-----------|-----------------|
| **Models** | `prisma/schema.prisma` | Definição de entidades e relacionamentos |
| **Repositories** | `src/repositories/` | Interfaces de acesso a dados |
| **Prisma Repos** | `src/repositories/prisma/` | Implementação real com PostgreSQL |
| **In-Memory Repos** | `src/repositories/in-memory/` | Implementação para testes |
| **Use Cases** | `src/use-cases/` | Regras de negócio |
| **Controllers** | `src/http/controllers/` | Endpoints HTTP (Fastify) |
| **Infra** | `src/infra/` | Integrações externas (Google) |
| **Utils** | `src/utils/` | Either pattern, paginação, constantes |

**Padrão Either**: Todos os use cases retornam `Either<Error, Success>` — sem exceções para fluxos de negócio.

**Factories**: Cada use case possui uma factory `make*UseCase()` que instancia as dependências com Prisma.

---

## 2. Models / Entidades (Prisma)

### 2.1 `Role` (Enum)
| Valor | Descrição |
|-------|-----------|
| `ADMIN` | Administrador do sistema |
| `LAWYER` | Advogado |
| `ASSISTANT` | Assistente |

### 2.2 `User`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `name` | `String` | Nome completo |
| `email` | `String (unique)` | E-mail (login) |
| `password_hash` | `String` | Hash da senha (Argon2) |
| `role` | `Role` | Papel do usuário (default: ASSISTANT) |
| `createdAt` | `DateTime` | Data de criação |
| `updatedAt` | `DateTime` | Última atualização |

**Relacionamentos**: `1:1` com `Lawyer`, `1:1` com `GoogleCalendarConnection`, `1:N` com `CalendarEvent`.

### 2.3 `Workspace`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `name` | `String` | Nome do escritório |
| `cnpj` | `String (unique)` | CNPJ |
| `email` | `String` | E-mail do escritório |
| `cellphone` | `String` | Telefone |
| `createdAt/updatedAt` | `DateTime` | Timestamps |

**Relacionamentos**: `1:N` com `Lawyer`, `Lead`, `Client`.

### 2.4 `Lawyer`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `userId` | `String (unique)` | FK → User |
| `workspaceId` | `String` | FK → Workspace |
| `cellphone` | `String` | Telefone do advogado |
| `name` | `String` | Nome |
| `oab` | `String` | Número da OAB |
| `oabState` | `String` | Estado da OAB |
| `pix` | `String` | Chave PIX |
| `createdAt` | `DateTime` | Data de criação |

**Relacionamentos**: `N:1` User (cascade), `N:1` Workspace (cascade), `1:N` Lead, `1:N` Client.

### 2.5 `Lead`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `workspaceId` | `String` | FK → Workspace |
| `lawyerId` | `String?` | FK → Lawyer (opcional) |
| `name/cellphone/email` | `String` | Dados de contato |
| `createdAt/updatedAt` | `DateTime` | Timestamps |

**Relacionamentos**: `N:1` Workspace, `N:1?` Lawyer, `1:N` CaseAnalysis, `1:1?` Client (LeadToClient).

### 2.6 `Client`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `name/email/cellphone` | `String` | Dados pessoais |
| `maritalStatus/profession` | `String` | Estado civil e profissão |
| `rg/issuingAgency/cpf` | `String` | Documentos |
| `street/neighborhood/city/state/zipCode` | `String` | Endereço |
| `workspaceId` | `String` | FK → Workspace |
| `lawyerId` | `String?` | FK → Lawyer |
| `createdFromLeadId` | `String? (unique)` | FK → Lead (conversão) |

### 2.7 `ScreeningFlow`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `caseType` | `String` | Tipo de caso jurídico |
| `lawyerId` | `String?` | Advogado associado |
| `questions` | `Json` | Perguntas do fluxo |

**Relacionamentos**: `1:N` AiSession.

### 2.8 `AiSession`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `screeningFlowId` | `String?` | FK → ScreeningFlow |
| `chatId` | `String` | ID do chat |
| `status` | `String` | Status da sessão |
| `chatState` | `Json` | Estado do chat |
| `name/cellphone` | `String` | Dados do contato |
| `isThirdParty` | `Boolean` | Se é terceiro |

**Relacionamentos**: `N:1?` ScreeningFlow, `1:N` CaseAnalysis.

### 2.9 `CaseAnalysis`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | `String (UUID)` | Chave primária |
| `aiSessionId` | `String` | FK → AiSession |
| `leadId` | `String` | FK → Lead |
| `title` | `String` | Título da análise |
| `viabilityLabel` | `String` | Rótulo de viabilidade |
| `analysisText` | `String` | Texto da análise |
| `estimatedComplexity` | `String` | Complexidade estimada |
| `mainLegalBase` | `String` | Base legal principal |

### 2.10 `GoogleCalendarConnection`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id/userId(unique)` | `String` | PK e FK → User |
| `googleEmail` | `String` | E-mail Google vinculado |
| `accessToken/refreshToken` | `String` | Tokens OAuth2 |
| `tokenExpiresAt` | `DateTime` | Expiração do token |

### 2.11 `CalendarEvent`
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id/userId/googleEventId` | `String` | PK e FKs |
| `summary/description` | `String` | Dados do evento |
| `startsAt/endsAt` | `DateTime` | Período |
| `hangoutLink` | `String?` | Link do Google Meet |

---

## 3. Repository Interfaces

Todas seguem o mesmo padrão CRUD com suporte a paginação.

### 3.1 `UsersRepository`
- `create(data: Prisma.UserCreateInput): Promise<User>`
- `findByEmail(email: string): Promise<User | null>`
- `findById(id: string): Promise<User | null>`
- `findMany(params: PaginationParams): Promise<PaginatedResult<User>>`
- `save(user: User): Promise<User>`

### 3.2 `WorkspacesRepository`
- `create(data)`, `delete(id)`, `findByCnpj(cnpj)`, `findById(id)`, `findMany(params)`, `save(workspace)`

### 3.3 `LawyersRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findByUserId(userId)`, `findMany(params)`, `save(lawyer)`

### 3.4 `LeadsRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findMany(params)`, `save(lead)`

### 3.5 `ClientsRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findByLeadId(leadId)`, `findMany(params)`, `save(client)`

### 3.6 `ScreeningFlowsRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findMany(params)`, `save(screeningFlow)`

### 3.7 `AiSessionRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findMany(params)`, `save(aiSession)`

### 3.8 `CaseAnalysisRepository`
- `create(data)`, `delete(id)`, `findById(id)`, `findMany(params)`, `save(caseAnalysis)`

### 3.9 `CalendarConnectionsRepository`
- `deleteByUserId(userId): Promise<void>`
- `findByUserId(userId): Promise<GoogleCalendarConnection | null>`
- `upsertByUserId(userId, data): Promise<GoogleCalendarConnection>`

### 3.10 `CalendarEventsRepository`
- `deleteByGoogleEventId(userId, googleEventId): Promise<void>`
- `upsertByGoogleEventId(userId, googleEventId, data): Promise<CalendarEvent>`

---

## 4. Repository Implementations

### Prisma Implementations (`src/repositories/prisma/`)

Cada classe implementa a interface correspondente usando o Prisma Client (`prisma` singleton). Paginação usa `skip/take` com `ITEM_PER_PAGE = 20` e transações `$transaction` para count + findMany.

| Classe | Interface |
|--------|-----------|
| `PrismaUsersRepository` | `UsersRepository` |
| `PrismaWorkspacesRepository` | `WorkspacesRepository` |
| `PrismaLawyersRepository` | `LawyersRepository` |
| `PrismaLeadsRepository` | `LeadsRepository` |
| `PrismaClientsRepository` | `ClientsRepository` |
| `PrismaScreeningFlowsRepository` | `ScreeningFlowsRepository` |
| `PrismaAiSessionRepository` | `AiSessionRepository` |
| `PrismaCaseAnalysisRepository` | `CaseAnalysisRepository` |
| `PrismaCalendarConnectionsRepository` | `CalendarConnectionsRepository` |
| `PrismaCalendarEventsRepository` | `CalendarEventsRepository` |

### In-Memory Implementations (`src/repositories/in-memory/`)

Para testes unitários. Armazenam dados em arrays privados `items: T[]`. Mesmo padrão de paginação com `slice()`.

---

## 5. Use Cases por Módulo

### 5.1 Users

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `RegisterUserUseCase` | `UsersRepository` | Registra usuário; hash Argon2; verifica email duplicado |
| `AuthenticateUseCase` | `UsersRepository` | Login com email/senha; verifica hash com Argon2 |
| `GetUserProfileUseCase` | `UsersRepository` | Busca perfil por ID |
| `EditUserUseCase` | `UsersRepository` | Edita nome/email/role; verifica unicidade de email |
| `FetchUsersUseCase` | `UsersRepository` | Lista paginada de usuários |

### 5.2 Workspaces

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateWorkspaceUseCase` | `WorkspacesRepository` | Cria escritório; verifica CNPJ duplicado |
| `EditWorkspaceUseCase` | `WorkspacesRepository` | Edita dados; verifica CNPJ |
| `DeleteWorkspaceUseCase` | `WorkspacesRepository` | Remove por ID |
| `FetchWorkspacesUseCase` | `WorkspacesRepository` | Lista paginada |
| `GetWorkspaceUseCase` | `WorkspacesRepository` | Busca por ID |

### 5.3 Lawyers

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateLawyerUseCase` | `LawyersRepo`, `UsersRepo`, `WorkspacesRepo` | Cria advogado vinculado a user e workspace; verifica existência de ambos |
| `EditLawyerUseCase` | `LawyersRepo`, `UsersRepo`, `WorkspacesRepo` | Edita todos os campos; valida FK de user e workspace |
| `DeleteLawyerUseCase` | `LawyersRepo` | Remove por ID |
| `FetchLawyersUseCase` | `LawyersRepo`, `UsersRepo` | Lista com dados do user (name, email) |
| `GetLawyerUseCase` | `LawyersRepo`, `UsersRepo` | Busca com dados do user |

### 5.4 Leads

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateLeadUseCase` | `LeadsRepo`, `WorkspacesRepo`, `UsersRepo` | Cria lead; valida workspace e lawyer |
| `EditLeadUseCase` | `LeadsRepo`, `WorkspacesRepo`, `UsersRepo` | Edita; valida FKs |
| `DeleteLeadUseCase` | `LeadsRepo` | Remove por ID |
| `FetchLeadsUseCase` | `LeadsRepo` | Lista paginada |
| `GetLeadUseCase` | `LeadsRepo` | Busca por ID |

### 5.5 Clients

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateClientUseCase` | `ClientsRepo`, `WorkspacesRepo`, `LawyersRepo` | Cria cliente com dados completos (endereço, documentos) |
| `EditClientUseCase` | `ClientsRepo`, `LawyersRepo`, `WorkspacesRepo` | Edita todos os 16+ campos |
| `DeleteClientUseCase` | `ClientsRepo` | Remove por ID |
| `FetchClientsUseCase` | `ClientsRepo` | Lista paginada |
| `GetClientUseCase` | `ClientsRepo` | Busca por ID |
| `ConvertLeadToClientUseCase` | `LeadsRepo`, `ClientsRepo`, `WorkspacesRepo` | Converte Lead → Client; herda dados do lead; verifica conversão duplicada |
| `GenerateContractUseCase` | `ClientsRepo`, `LawyersRepo`, `WorkspacesRepo`, `DriveDocsGateway`, `CalendarConnectionsRepo`, `CalendarGateway` | Gera contrato no Google Docs a partir de template com substituição de variáveis |

### 5.6 Calendar

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `GenerateGoogleAuthUrlUseCase` | `CalendarGateway`, `GoogleOAuthStateSigner` | Gera URL OAuth2 com state assinado |
| `ConnectGoogleCalendarUseCase` | `OAuthStateSigner`, `CalendarGateway`, `CalendarConnectionsRepo` | Troca code por tokens; salva conexão |
| `DisconnectGoogleCalendarUseCase` | `CalendarConnectionsRepo` | Remove conexão Google |
| `CreateCalendarEventWithMeetUseCase` | `CalendarConnectionsRepo`, `CalendarEventsRepo`, `CalendarGateway` | Cria evento com Google Meet |
| + `EditCalendarEvent`, `DeleteCalendarEvent`, `FetchCalendarEvents`, `GetCalendarEvent` | — | CRUD de eventos |

**Função auxiliar**: `ensureGoogleAccessToken()` — refresh automático de token se expirado (window de 1 min).

### 5.7 AI Sessions

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateAiSessionUseCase` | `AiSessionRepo`, `ScreeningFlowsRepo` | Cria sessão de IA; valida screening flow |
| + `Edit`, `Delete`, `Fetch`, `Get` | `AiSessionRepo` | CRUD padrão |

### 5.8 Case Analysis

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateCaseAnalysisUseCase` | `AiSessionRepo`, `CaseAnalysisRepo` | Cria análise de caso; valida AI session |
| + `Edit`, `Delete`, `Fetch`, `Get` | `CaseAnalysisRepo` | CRUD padrão |

### 5.9 Screening Flows

| Use Case | Dependências | Descrição |
|----------|-------------|-----------|
| `CreateScreeningFlowUseCase` | `ScreeningFlowsRepo` | Cria fluxo de triagem (caseType + questions JSON) |
| + `Edit`, `Delete`, `Fetch`, `Get` | `ScreeningFlowsRepo` | CRUD padrão |

---

## 6. Classes de Erro

Todas estendem `Error` nativo. Organizadas por módulo em `use-cases/*/errors/`.

| Classe | Módulo | Mensagem |
|--------|--------|----------|
| `UserAlreadyExistsError` | Users | "E-mail already exists." |
| `UserNotFoundError` | Users | `User "${id}" not found.` |
| `InvalidCredentialsError` | Users | "Invalid credentials." |
| `EmailIsAlreadyInUseError` | Users | `The email "${email}" is already in use.` |
| `InvalidPageError` | Users/Workspaces/Leads/Lawyers/AI/CaseAnalysis/ScreeningFlows | Página inválida |
| `CnpjIsAlreadyInUseError` | Workspaces | CNPJ duplicado |
| `WorkspaceNotFoundError` | Workspaces/Leads/Lawyers | Workspace não encontrado |
| `LawyerNotFoundError` | Lawyers/Leads | Advogado não encontrado |
| `LawyerAlreadyExistsError` | Lawyers | Advogado já existe para o user |
| `LeadNotFoundError` | Leads | Lead não encontrado |
| `ClientNotFoundError` | Clients | Cliente não encontrado |
| `LeadAlreadyConvertedError` | Clients | Lead já convertido |
| `GoogleDocsIntegrationError` | Clients | Erro na integração Google Docs |
| `ScreeningFlowNotFoundError` | ScreeningFlows/AI | Fluxo não encontrado |
| `AiSessionNotFoundError` | AI Sessions | Sessão não encontrada |
| `CaseAnalysisNotFoundError` | Case Analysis | Análise não encontrada |
| `CalendarConnectionNotFoundError` | Calendar | Conexão Google não encontrada |
| `CalendarEventNotFoundError` | Calendar | Evento não encontrado |
| `GoogleCalendarIntegrationError` | Calendar | Erro na integração Calendar |
| `InvalidOAuthStateError` | Calendar | State OAuth inválido/expirado |

---

## 7. Infraestrutura (Gateways)

### 7.1 `CalendarGateway` (Interface)

Define o contrato para integração com Google Calendar:

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `getAuthUrl(state)` | `string` | URL de autenticação OAuth2 |
| `exchangeCodeForTokens(code)` | `Promise<GoogleTokenPayload>` | Troca code por tokens |
| `refreshAccessToken(token)` | `Promise<GoogleTokenPayload>` | Renova access token |
| `getProfile(token)` | `Promise<GoogleProfile>` | E-mail do usuário Google |
| `listEvents(input)` | `Promise<CalendarGatewayEvent[]>` | Lista eventos |
| `getEvent(token, id)` | `Promise<Event \| null>` | Busca evento |
| `createEventWithMeet(input)` | `Promise<Event>` | Cria evento + Meet |
| `updateEvent(input)` | `Promise<Event \| null>` | Atualiza evento |
| `deleteEvent(token, id)` | `Promise<void>` | Remove evento |

### 7.2 `GoogleCalendarGateway` (implements CalendarGateway)
Implementação real usando `googleapis`. Possui OAuth2Client privado e métodos auxiliares `getCalendarClient()` e `toGatewayEvent()`.

### 7.3 `DriveDocsGateway` (Interface)
- `copyTemplateAndReplace(input): Promise<{documentId, documentUrl}>`

### 7.4 `GoogleDriveDocsGateway` (implements DriveDocsGateway)
Copia template do Google Docs, substitui placeholders `{chave}` e retorna URL do documento.

### 7.5 `GoogleOAuthStateSigner`
| Atributo/Método | Descrição |
|-----------------|-----------|
| `-secret: string` | Chave HMAC |
| `sign({userId})` | Gera state Base64URL + HMAC-SHA256 (TTL: 10 min) |
| `verify(state)` | Valida assinatura e expiração; retorna `{userId}` ou `null` |

---

## 8. Utilities

### 8.1 Either Pattern (`src/utils/either.ts`)

| Classe/Type | Descrição |
|-------------|-----------|
| `Left<L, R>` | Representa erro; `value: L`, `isLeft() → true` |
| `Right<L, R>` | Representa sucesso; `value: R`, `isRight() → true` |
| `Either<L, R>` | Type alias: `Left<L,R> \| Right<L,R>` |
| `left(value)` | Factory para `Left` |
| `right(value)` | Factory para `Right` |

### 8.2 Paginação
- **`PaginationParams`**: `{ page: number }`
- **`PaginatedResult<T>`**: `{ items: T[], total: number }`
- **`ITEM_PER_PAGE`**: `20`

### 8.3 HTTP Status Constants
```typescript
HTTP_STATUS = { OK: 200, CREATED: 201, NO_CONTENT: 204, BAD_REQUEST: 400,
  UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500 }
```

---

## 9. Factories

Cada use case possui uma factory em `use-cases/*/factories/make-*-use-case.ts`. Padrão:

```typescript
export function makeXxxUseCase() {
  const repo = new PrismaXxxRepository();
  return new XxxUseCase(repo);
}
```

Para use cases com múltiplas dependências (ex: `CreateLawyerUseCase`), a factory instancia todos os repositórios necessários.

**Factories de infra** (`src/infra/google/`):
- `makeGoogleCalendarGateway()` → `GoogleCalendarGateway`
- `makeGoogleDriveDocsGateway()` → `GoogleDriveDocsGateway`
- `makeGoogleOAuthStateSigner()` → `GoogleOAuthStateSigner(env.GOOGLE_OAUTH_STATE_SECRET)`

---

## 10. HTTP Layer

### 10.1 App (`src/app.ts`)
Fastify com plugins: `@fastify/jwt`, `@fastify/cors`, `@fastify/swagger`, `@scalar/fastify-api-reference`. Usa `fastify-type-provider-zod` para validação de schemas.

### 10.2 Middleware: `verifyJWT`
Valida token JWT no header `Authorization: Bearer <token>`. Retorna 401 se inválido.

### 10.3 JWT Payload
```typescript
{ sub: string, role: Role }
```

### 10.4 Controllers (9 módulos de rotas)
Cada módulo em `src/http/controllers/<module>/routes.ts` registra endpoints REST padrão:

| Módulo | Endpoints |
|--------|-----------|
| `users` | register, authenticate, profile, get, edit, fetch |
| `workspaces` | create, get, edit, delete, fetch |
| `lawyers` | create, get, edit, delete, fetch |
| `leads` | create, get, edit, delete, fetch |
| `clients` | create, get, edit, delete, fetch, convert, generate-contract |
| `calendar` | connect-url, callback, disconnect, create/edit/delete/fetch/get-event |
| `ai-sessions` | create, get, edit, delete, fetch |
| `case-analysis` | create, get, edit, delete, fetch |
| `screening-flows` | create, get, edit, delete, fetch |
