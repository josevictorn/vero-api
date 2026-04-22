# Módulo Calendar (Google Calendar + Meet)

Plano simplificado de implementação usando a lib `googleapis` e padrão de Gateway.

## Objetivo

Permitir que o usuário:

1. Conecte sua conta Google Calendar via OAuth2.
2. Gerencie eventos (listar, obter, criar, editar, excluir).
3. Crie evento com link do Google Meet automaticamente.

---

## Estratégia técnica (simples)

- **SDK oficial:** `googleapis` (evita chamadas HTTP manuais).
- **Padrão de integração:** `Gateway` para isolar Google da regra de negócio.
- **Clean Architecture atual:**
  - Controllers: HTTP + Zod
  - Use Cases: regras de negócio
  - Repositories: persistência
  - Gateway: integração externa (Google)

---

## Arquitetura proposta

### 1) Gateway

Criar contrato:

- `CalendarGateway`
  - `getAuthUrl(state)`
  - `exchangeCodeForTokens(code)`
  - `refreshAccessToken(refreshToken)`
  - `getProfile(accessToken)`
  - `listEvents(...)`
  - `getEvent(...)`
  - `createEventWithMeet(...)`
  - `updateEvent(...)`
  - `deleteEvent(...)`

Criar implementação:

- `GoogleCalendarGateway` usando `googleapis`:
  - `google.auth.OAuth2`
  - `google.calendar({ version: "v3", auth })`

### 2) Persistência

Usar tabelas já criadas:

- `google_calendar_connections`
- `calendar_events` (espelho local opcional para sync e paginação rápida)

### 3) Use Cases

- `GenerateGoogleAuthUrlUseCase`
- `ConnectGoogleCalendarUseCase`
- `DisconnectGoogleCalendarUseCase`
- `FetchCalendarEventsUseCase`
- `GetCalendarEventUseCase`
- `CreateCalendarEventWithMeetUseCase`
- `EditCalendarEventUseCase`
- `DeleteCalendarEventUseCase`

### 4) Controllers

- `GET /calendar/google/connect-url`
- `GET /calendar/google/callback`
- `DELETE /calendar/google/disconnect`
- `GET /calendar/events`
- `GET /calendar/events/:id`
- `POST /calendar/events` (com Meet)
- `PATCH /calendar/events/:id`
- `DELETE /calendar/events/:id`

---

## Fluxo funcional

### Conectar conta Google

1. API gera URL OAuth (`access_type=offline`, `prompt=consent`, `scope=calendar`).
2. Frontend redireciona usuário.
3. Google retorna `code` + `state`.
4. Use case troca `code` por token via gateway.
5. Persistir conexão (`accessToken`, `refreshToken`, `expiresAt`, `email`).

### Criar evento com Meet

1. Controller valida payload.
2. Use case busca conexão do usuário.
3. Gateway chama `events.insert` com:
   - `conferenceData.createRequest.requestId`
   - `conferenceDataVersion=1`
4. Resposta retorna `eventId` e `hangoutLink`.
5. (Opcional) salvar espelho local em `calendar_events`.

---

## Plano de implementação (3 fases)

## Fase 1 — Base OAuth + Gateway

1. Instalar `googleapis`.
2. Criar `CalendarGateway` (interface).
3. Implementar `GoogleCalendarGateway` com OAuth2.
4. Ajustar env:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI`
   - `GOOGLE_OAUTH_STATE_SECRET`
5. Validar fluxo de conexão/desconexão.

**Pronto quando:** usuário consegue conectar e desconectar conta Google com sucesso.

## Fase 2 — Gestão de eventos

1. Implementar list/get/create/update/delete no gateway.
2. Implementar use cases e factories.
3. Criar controllers e rotas protegidas com JWT.
4. Criar endpoint de criação com Meet.

**Pronto quando:** CRUD de eventos funcionando no Google Calendar, com criação de Meet.

## Fase 3 — Robustez

1. Refresh automático de token ao expirar.
2. Mapeamento de erros Google → erros de domínio.
3. Testes unitários dos use cases (mock de gateway).
4. Testes de rota para contratos HTTP.

**Pronto quando:** módulo está resiliente, testado e documentado.

---

## Boas práticas obrigatórias

- Nunca expor `accessToken`/`refreshToken` em respostas.
- Criptografar tokens em banco (próxima etapa de segurança).
- Validar `state` com assinatura e TTL.
- Tratar renovação de token no gateway (transparente ao use case).
- Manter Google SDK somente na camada Gateway.

---

## Exemplo de criação de evento com Meet (conceito)

No `GoogleCalendarGateway`, usar `google.calendar("v3").events.insert` com:

- `calendarId: "primary"`
- `requestBody.summary`, `requestBody.start`, `requestBody.end`
- `requestBody.conferenceData.createRequest.requestId`
- `conferenceDataVersion: 1`

Resultado esperado: evento criado e `hangoutLink` disponível na resposta.

---

## Critérios de aceite do módulo

1. Usuário conecta Google Calendar com OAuth2.
2. Usuário lista, consulta, cria, edita e remove eventos.
3. Criação de evento gera link do Google Meet automaticamente.
4. API não expõe segredos/tokens.
5. Testes principais passando.
