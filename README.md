# Vero API - Documentação Técnica

Uma API REST moderna construída com **Fastify**, **TypeScript**, **Prisma** e **PostgreSQL**, seguindo os princípios de **Clean Architecture** com padrões de **Domain-Driven Design (DDD)**.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Componentes Principais](#componentes-principais)
- [Como Construir Componentes](#como-construir-componentes)
- [Guia de Desenvolvimento](#guia-de-desenvolvimento)
- [Scripts Disponíveis](#scripts-disponíveis)

---

## 🎯 Visão Geral

A **Vero API** é um sistema de gerenciamento de usuários e workspaces. A aplicação é estruturada em camadas bem definidas para garantir:

- ✅ **Separação de responsabilidades** clara
- ✅ **Testabilidade** em todos os níveis
- ✅ **Reutilização de código**
- ✅ **Fácil manutenção e expansão**

---

## 🏗️ Arquitetura

A aplicação segue o padrão **Clean Architecture** com as seguintes camadas:

```
┌─────────────────────────────────────────┐
│      HTTP Layer (Controllers)           │  ← Recebe requisições HTTP
├─────────────────────────────────────────┤
│      Use Cases (Business Logic)         │  ← Lógica de negócio
├─────────────────────────────────────────┤
│      Repositories (Data Access)         │  ← Abstração de dados
├─────────────────────────────────────────┤
│      Database (Prisma + PostgreSQL)     │  ← Persistência
└─────────────────────────────────────────┘
```

### Fluxo de uma Requisição

```
[Cliente HTTP] 
    ↓
[Controller] 
    ↓ valida entrada com Zod
[Use Case] 
    ↓ contém lógica de negócio
[Repository] 
    ↓ acessa dados
[Database] 
    ↓ retorna dados
[Use Case] 
    ↓ formata resposta (Either<Error, Success>)
[Controller] 
    ↓ converte para HTTP
[Cliente HTTP] ← recebe resposta
```

---

## 💻 Stack Tecnológico

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Fastify** | ^5.8.4 | Framework web HTTP |
| **TypeScript** | ^6.0.2 | Tipagem estática |
| **Prisma** | ^7.7.0 | ORM para acesso a dados |
| **PostgreSQL** | - | Banco de dados relacional |
| **Zod** | ^4.3.6 | Validação de dados |
| **Argon2** | ^0.44.0 | Hashing de senhas |
| **JWT** | via fastify-jwt | Autenticação |
| **Vitest** | ^4.1.4 | Testes unitários |

---

## 📁 Estrutura de Pastas

```
src/
├── app.ts                          # Configuração da aplicação Fastify
├── server.ts                       # Inicialização do servidor
├── env/                            # Variáveis de ambiente
│   └── index.ts                    # Schema de validação Zod
├── http/
│   ├── controllers/                # Camada de requisições HTTP
│   │   └── users/
│   │       ├── routes.ts           # Agrupa todas as rotas
│   │       ├── register.ts         # POST /users
│   │       ├── authenticate.ts     # POST /users/authenticate
│   │       ├── profile.ts          # GET /me
│   │       ├── fetch.ts            # GET /users
│   │       ├── get.ts              # GET /users/:id
│   │       └── edit.ts             # PATCH /users/:id
│   └── middlewares/
│       └── verify-jwt.ts           # Middleware de autenticação
├── use-cases/                      # Lógica de negócio
│   └── users/
│       ├── register.ts             # Caso de uso: Registrar usuário
│       ├── authenticate.ts         # Caso de uso: Autenticar
│       ├── get-user-profile.ts     # Caso de uso: Obter perfil
│       ├── edit-user.ts            # Caso de uso: Editar usuário
│       ├── fetch-users.ts          # Caso de uso: Listar usuários
│       ├── errors/                 # Erros específicos do domínio
│       │   ├── user-already-exists-error.ts
│       │   ├── user-not-found-error.ts
│       │   ├── invalid-credentials-error.ts
│       │   ├── email-is-already-in-use-error.ts
│       │   └── invalid-page-error.ts
│       ├── factories/              # Factory Pattern para injeção
│       │   ├── make-register-user-use-case.ts
│       │   ├── make-authenticate-use-case.ts
│       │   ├── make-get-user-profile-use-case.ts
│       │   ├── make-edit-user-use-case.ts
│       │   └── make-fetch-users-use-case.ts
│       └── *.spec.ts               # Testes unitários
├── repositories/                   # Camada de acesso a dados
│   ├── users-repository.ts         # Interface do repositório
│   ├── prisma/
│   │   └── prisma-users-repository.ts   # Implementação com Prisma
│   └── in-memory/
│       └── in-memory-users-repository.ts # Implementação em memória
├── lib/
│   └── prisma.ts                   # Instância do Prisma Client
├── utils/
│   ├── constants.ts                # Constantes da aplicação
│   ├── either.ts                   # Type Either para tratamento de erros
│   ├── paginated-results.ts        # Tipo para resultados paginados
│   └── pagination-params.ts        # Parâmetros de paginação
└── @types/
    └── fastify-jwt.d.ts            # Tipos customizados para Fastify JWT

prisma/
├── schema.prisma                   # Schema do banco de dados
└── migrations/                     # Histórico de migrações
```

---

## 🧩 Componentes Principais

### 1. **Controllers** (Camada HTTP)

**Responsabilidade:** Receber requisições HTTP, validar entrada, chamar casos de uso e retornar respostas.

**Localização:** `src/http/controllers/`

**Características:**
- Usam `FastifyPluginAsyncZod` como tipo
- Validam entrada com **Zod**
- Geram documentação OpenAPI automaticamente
- Aplicam middlewares (ex: `verifyJWT`)

**Exemplo - Register Controller:**

```typescript
export const RegisterUserController: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/users",
    {
      schema: {
        tags: ["users"],
        summary: "Create a new user",
        body: z.object({
          name: z.string().min(3),
          email: z.email(),
          password: z.string().min(6),
          role: z.enum(Role).optional(),
        }),
        response: {
          201: z.object({ userId: z.uuid() }),
          400: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role } = request.body;
      const registerUseCase = makeRegisterUseCase();
      const result = await registerUseCase.execute({
        name, email, password, role,
      });

      if (result.isLeft()) {
        // Tratar erro
        return reply.status(409).send({ message: error.message });
      }

      return reply.status(201).send({ userId: result.value.user.id });
    }
  );
};
```

---

### 2. **Use Cases** (Lógica de Negócio)

**Responsabilidade:** Implementar regras de negócio isoladas da infraestrutura.

**Localização:** `src/use-cases/`

**Características:**
- Uma classe por caso de uso
- Recebem repositórios injetados
- Retornam `Either<Error, Success>` para tratamento funcional
- Possuem testes unitários
- Não dependem de frameworks

**Exemplo - RegisterUserUseCase:**

```typescript
export class RegisterUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({
    name,
    email,
    password,
    role,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const password_hash = await hash(password);

    // Verificar se email já existe
    const userWithSameEmail = await this.usersRepository.findByEmail(email);
    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError());
    }

    // Criar novo usuário
    const user = await this.usersRepository.create({
      name,
      email,
      password_hash,
      role,
    });

    return right({ user });
  }
}
```

---

### 3. **Repositories** (Acesso a Dados)

**Responsabilidade:** Abstrair acesso a dados, permitindo múltiplas implementações.

**Localização:** `src/repositories/`

**Características:**
- Interface define contrato
- Múltiplas implementações (Prisma, In-Memory)
- Facilita testes (trocar por in-memory)
- Isolam lógica de persistência

**Exemplo - Interface:**

```typescript
export interface UsersRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<User>>;
  save(user: User): Promise<User>;
}
```

**Implementação com Prisma:**

```typescript
export class PrismaUsersRepository implements UsersRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  // ... outros métodos
}
```

**Implementação In-Memory (para testes):**

```typescript
export class InMemoryUsersRepository implements UsersRepository {
  private items: User[] = [];

  async create(data: Prisma.UserCreateInput) {
    const user = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(user);
    return user;
  }

  // ... outros métodos
}
```

---

### 4. **Factories** (Injeção de Dependência)

**Responsabilidade:** Criar instâncias de use cases com suas dependências.

**Localização:** `src/use-cases/users/factories/`

**Características:**
- Pattern Factory
- Centralizam configuração
- Facilitam mudanças futuras
- Permitem trocar implementações

**Exemplo:**

```typescript
export function makeRegisterUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const registerUseCase = new RegisterUserUseCase(usersRepository);
  return registerUseCase;
}

// Em testes:
export function makeRegisterUseCaseForTests() {
  const usersRepository = new InMemoryUsersRepository();
  const registerUseCase = new RegisterUserUseCase(usersRepository);
  return registerUseCase;
}
```

---

### 5. **Erros do Domínio**

**Responsabilidade:** Representar erros específicos do negócio.

**Localização:** `src/use-cases/users/errors/`

**Características:**
- Estendem `Error` nativo
- São específicas do domínio
- Facilitam tratamento na camada HTTP

**Exemplo:**

```typescript
export class UserAlreadyExistsError extends Error {
  constructor() {
    super("User with this email already exists.");
  }
}

// Uso:
if (userExists) {
  return left(new UserAlreadyExistsError());
}
```

---

### 6. **Either** (Tratamento Funcional de Erros)

**Responsabilidade:** Representar sucesso ou falha sem exceções.

**Localização:** `src/utils/either.ts`

**Características:**
- `Left` para erro
- `Right` para sucesso
- Evita exceções
- Força tratamento de erros

**Exemplo:**

```typescript
type Result = Either<UserNotFoundError, { user: User }>;

const result: Result = await useCase.execute(id);

if (result.isLeft()) {
  // Tratar erro
  const error = result.value; // UserNotFoundError
}

if (result.isRight()) {
  // Usar sucesso
  const { user } = result.value;
}
```

---

## 🔨 Como Construir Componentes

### 1. Adicionar um Novo Caso de Uso

**Passo 1:** Criar arquivo do caso de uso

```typescript
// src/use-cases/users/delete-user.ts
import type { User } from "@generated/prisma/client";
import type { UsersRepository } from "@/repositories/users-repository";
import { type Either, left, right } from "@/utils/either";
import { UserNotFoundError } from "./errors/user-not-found-error";

interface DeleteUserUseCaseRequest {
  userId: string;
}

type DeleteUserUseCaseResponse = Either<UserNotFoundError, { success: true }>;

export class DeleteUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: DeleteUserUseCaseRequest): Promise<DeleteUserUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new UserNotFoundError(userId));
    }

    // Lógica de deleção
    // await this.usersRepository.delete(userId);

    return right({ success: true });
  }
}
```

**Passo 2:** Criar factory

```typescript
// src/use-cases/users/factories/make-delete-user-use-case.ts
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { DeleteUserUseCase } from "../delete-user";

export function makeDeleteUserUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const deleteUserUseCase = new DeleteUserUseCase(usersRepository);
  return deleteUserUseCase;
}
```

**Passo 3:** Criar testes

```typescript
// src/use-cases/users/delete-user.spec.ts
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { DeleteUserUseCase } from "./delete-user";

describe("Delete User Use Case", () => {
  let usersRepository: InMemoryUsersRepository;
  let sut: DeleteUserUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new DeleteUserUseCase(usersRepository);
  });

  it("should be able to delete a user", async () => {
    const user = await usersRepository.create({
      name: "John Doe",
      email: "john@example.com",
      password_hash: "hash",
    });

    const result = await sut.execute({ userId: user.id });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({ success: true });
  });

  it("should return error if user not found", async () => {
    const result = await sut.execute({ userId: "invalid-id" });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserNotFoundError);
  });
});
```

**Passo 4:** Criar controller

```typescript
// src/http/controllers/users/delete.ts
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { UserNotFoundError } from "@/use-cases/users/errors/user-not-found-error";
import { makeDeleteUserUseCase } from "@/use-cases/users/factories/make-delete-user-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteUserController: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/users/:id",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["users"],
        summary: "Delete a user",
        params: z.object({
          id: z.uuid(),
        }),
        response: {
          204: z.null().describe("User deleted successfully"),
          404: z.object({ message: z.string() }).describe("User not found"),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const deleteUseCase = makeDeleteUserUseCase();
      const result = await deleteUseCase.execute({ userId: id });

      if (result.isLeft()) {
        const error = result.value;
        if (error instanceof UserNotFoundError) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            message: error.message,
          });
        }
      }

      return reply.status(HTTP_STATUS.NO_CONTENT).send();
    }
  );
};
```

**Passo 5:** Registrar controller nas rotas

```typescript
// src/http/controllers/users/routes.ts
import { DeleteUserController } from "./delete";

export async function usersRoutes(app: FastifyInstance) {
  // ... outros registros
  await app.register(DeleteUserController);
}
```

---

### 2. Adicionar um Novo Método ao Repositório

**Passo 1:** Adicionar à interface

```typescript
// src/repositories/users-repository.ts
export interface UsersRepository {
  // ... métodos existentes
  delete(id: string): Promise<void>;
}
```

**Passo 2:** Implementar no Prisma

```typescript
// src/repositories/prisma/prisma-users-repository.ts
async delete(id: string) {
  await prisma.user.delete({ where: { id } });
}
```

**Passo 3:** Implementar in-memory

```typescript
// src/repositories/in-memory/in-memory-users-repository.ts
async delete(id: string) {
  this.items = this.items.filter(item => item.id !== id);
}
```

---

### 3. Adicionar Validação Customizada

**Usar Zod no Controller:**

```typescript
body: z.object({
  email: z.email().refine(
    async (email) => {
      // Validação customizada
      const userExists = await usersRepository.findByEmail(email);
      return !userExists;
    },
    { message: "Email already registered" }
  ),
})
```

---

## 📚 Guia de Desenvolvimento

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Classes | PascalCase | `RegisterUserUseCase` |
| Funções | camelCase | `makeRegisterUseCase` |
| Constantes | UPPER_SNAKE_CASE | `ITEM_PER_PAGE` |
| Interfaces | PascalCase com prefixo | `UsersRepository` |
| Erros | PascalCase com sufixo `Error` | `UserNotFoundError` |
| Tipos | PascalCase com sufixo específico | `RegisterUserUseCaseResponse` |

### Boas Práticas

1. **Use injeção de dependência** via constructor
2. **Mantenha use cases desacoplados** de frameworks
3. **Crie testes antes do código** (TDD opcional)
4. **Use Either para erros**, não exceções
5. **Documente com comentários** em lógica complexa
6. **Valide entrada com Zod** nos controllers
7. **Use aliases de importação** (`@/*`, `@controllers/*`, etc.)

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

## 🔐 Autenticação

A aplicação usa **JWT (JSON Web Tokens)** com **Bearer tokens**.

- **Secret:** Definido em `.env` (`JWT_SECRET`)
- **Expiração:** 10 minutos
- **Middleware:** `verifyJWT` valida tokens
- **Hash de senha:** Argon2

**Exemplo de uso:**

```bash
# Autenticar
POST /users/authenticate
{
  "email": "user@example.com",
  "password": "password123"
}

# Resposta
{
  "access_token": "eyJhbGc...",
  "user": { ... }
}

# Usar em requisição protegida
GET /me
Authorization: Bearer eyJhbGc...
```

---

## 📊 Modelos de Dados

### User

```
id          UUID      (Chave primária)
name        String    (Obrigatório)
email       String    (Único, obrigatório)
password    String    (Hash com Argon2)
role        Enum      (ADMIN | LAWYER | ASSISTANT)
createdAt   DateTime  (Auto-gerado)
updatedAt   DateTime  (Auto-atualizado)
```

### Workspace (Futuro)

```
id          UUID      (Chave primária)
name        String    (Obrigatório)
cnpj        String    (Único, obrigatório)
email       String    (Obrigatório)
cellphone   String    (Obrigatório)
createdAt   DateTime  (Auto-gerado)
updatedAt   DateTime  (Auto-atualizado)
```

---

## 🧪 Testes

### Estrutura de Testes

```typescript
describe("RegisterUserUseCase", () => {
  let usersRepository: InMemoryUsersRepository;
  let sut: RegisterUserUseCase; // System Under Test

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new RegisterUserUseCase(usersRepository);
  });

  it("should be able to register", async () => {
    const result = await sut.execute({
      name: "John",
      email: "john@example.com",
      password: "123456",
    });

    expect(result.isRight()).toBe(true);
  });
});
```

---

## 📖 Documentação API

A documentação interativa está disponível em:

```
http://localhost:3333/docs
```

Gerada automaticamente com **Scalar API Reference** a partir do OpenAPI schema.

---

## 🛠️ Troubleshooting

### Erro: "Cannot find module '@controllers'"

**Solução:** Verifique `tsconfig.json` e configure path aliases corretamente.

### Erro: "Database connection failed"

**Solução:** Verifique `.env` e certifique-se que PostgreSQL está rodando.

### Testes falhando

**Solução:** Execute `pnpm test:watch` para debug interativo.
---

## 👤 Autor

- **José Victor**
- **Andre Lira**
- **Nathan Oliveira**

---

## 🤝 Contribuindo

1. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
2. Faça commits descritivos
3. Envie um Pull Request
4. Certifique-se que testes passam

---

**Última atualização:** Abril de 2026
