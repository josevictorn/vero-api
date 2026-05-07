import { describe, it, expect, beforeEach } from "vitest";
import { AiSessionStatus } from "@generated/prisma/client";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { InMemoryScreeningFlowsRepository } from "@/repositories/in-memory/in-memory-screening-flows-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { InMemoryChatMemoryProvider } from "@/providers/agents/memory/in-memory-chat-memory-provider";
import type {
	IdentifierAgent,
	IdentifierAgentInput,
	IdentifierAgentOutput,
} from "@/providers/agents/identifier/identifier-agent";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import { right, left, type Either } from "@/utils/either";
import { ProcessMessageIdentifyingAgentUseCase } from "./process-message-identifying-agent";
import { WorkspaceNotConfiguredError } from "./errors/workspace-not-configured-error";
import { ScreeningFlowNotMatchedError } from "./errors/screening-flow-not-matched-error";

class MockIdentifierAgent implements IdentifierAgent {
	public mockOutput: IdentifierAgentOutput = {
		messageToClient: "Olá! Como posso ajudá-lo?",
		identifiedCategory: "nao_identificado",
		isThirdParty: false,
		fullName: "nao_identificado",
	};

	public shouldFail = false;

	async identify(
		_input: IdentifierAgentInput,
	): Promise<Either<AgentResponseError, IdentifierAgentOutput>> {
		if (this.shouldFail) {
			return left(new AgentResponseError("identifier", "mock error"));
		}
		return right(this.mockOutput);
	}
}

describe("ProcessMessageIdentifyingAgentUseCase", () => {
	let aiSessionRepository: InMemoryAiSessionRepository;
	let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
	let workspacesRepository: InMemoryWorkspacesRepository;
	let chatMemoryProvider: InMemoryChatMemoryProvider;
	let mockAgent: MockIdentifierAgent;
	let sut: ProcessMessageIdentifyingAgentUseCase;

	beforeEach(async () => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		chatMemoryProvider = new InMemoryChatMemoryProvider();
		mockAgent = new MockIdentifierAgent();

		sut = new ProcessMessageIdentifyingAgentUseCase(
			screeningFlowsRepository,
			aiSessionRepository,
			workspacesRepository,
			mockAgent,
			chatMemoryProvider,
		);

		await workspacesRepository.create({
			name: "Escritório Vero",
			cnpj: "12345678000100",
			email: "contato@vero.com",
			cellphone: "11999999999",
		});

		await screeningFlowsRepository.create({
			caseType: "Trabalhista",
			questions: [{ question: "Quanto tempo trabalhou?" }],
		});

		await screeningFlowsRepository.create({
			caseType: "Previdenciário",
			questions: [{ question: "Qual o benefício?" }],
		});
	});

	it("should return identified: false when category is nao_identificado", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Olá! Qual é o seu nome completo?",
			identifiedCategory: "nao_identificado",
			isThirdParty: false,
			fullName: "nao_identificado",
		};

		const result = await sut.execute({
			aiSession,
			messageText: "Oi, boa tarde",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.identified).toBe(false);
			expect(result.value.messageToClient).toBe(
				"Olá! Qual é o seu nome completo?",
			);
		}
	});

	it("should return identified: false when name is nao_identificado", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Entendi! E qual o seu nome completo?",
			identifiedCategory: "Trabalhista",
			isThirdParty: false,
			fullName: "nao_identificado",
		};

		const result = await sut.execute({
			aiSession,
			messageText: "Fui demitido",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.identified).toBe(false);
		}
	});

	it("should return identified: true and update session when both are identified", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient:
				"Vi que é um caso Trabalhista. Vou fazer algumas perguntas para enviar ao advogado.",
			identifiedCategory: "Trabalhista",
			isThirdParty: false,
			fullName: "João da Silva",
		};

		const result = await sut.execute({
			aiSession,
			messageText: "Meu nome é João da Silva e fui demitido",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.identified).toBe(true);
			expect(result.value.messageToClient).toContain("Trabalhista");
		}

		const updatedSession = await aiSessionRepository.findById(aiSession.id);
		expect(updatedSession?.status).toBe(AiSessionStatus.INTERVIEWING);
		expect(updatedSession?.name).toBe("João da Silva");
		expect(updatedSession?.isThirdParty).toBe(false);
		expect(updatedSession?.screeningFlowId).toBeTruthy();
	});

	it("should match the correct screeningFlowId based on identified category", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Entendido, caso Previdenciário.",
			identifiedCategory: "Previdenciário",
			isThirdParty: true,
			fullName: "Maria Souza",
		};

		const result = await sut.execute({
			aiSession,
			messageText: "É para minha mãe Maria Souza, ela quer se aposentar",
		});

		expect(result.isRight()).toBe(true);

		const updatedSession = await aiSessionRepository.findById(aiSession.id);

		const flows = await screeningFlowsRepository.findMany({ page: 1 });
		const previdenciarioFlow = flows.items.find(
			(sf) => sf.caseType === "Previdenciário",
		);

		expect(updatedSession?.screeningFlowId).toBe(previdenciarioFlow?.id);
		expect(updatedSession?.isThirdParty).toBe(true);
	});

	it("should persist chat history in memory provider", async () => {
		const chatId = "5511999999999@s.whatsapp.net";
		const aiSession = await aiSessionRepository.create({
			chatId,
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Olá! Qual seu nome?",
			identifiedCategory: "nao_identificado",
			isThirdParty: false,
			fullName: "nao_identificado",
		};

		await sut.execute({
			aiSession,
			messageText: "Oi",
		});

		const history = await chatMemoryProvider.getHistory(
			`${chatId}-recepcao`,
		);
		expect(history).toHaveLength(2);
		expect(history[0]).toEqual({ role: "user", content: "Oi" });
		expect(history[1]).toEqual({
			role: "model",
			content: "Olá! Qual seu nome?",
		});
	});

	it("should accumulate chat history across multiple messages", async () => {
		const chatId = "5511999999999@s.whatsapp.net";
		const aiSession = await aiSessionRepository.create({
			chatId,
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Olá! Qual seu nome?",
			identifiedCategory: "nao_identificado",
			isThirdParty: false,
			fullName: "nao_identificado",
		};

		await sut.execute({ aiSession, messageText: "Oi" });

		mockAgent.mockOutput = {
			messageToClient: "João, como posso te ajudar?",
			identifiedCategory: "nao_identificado",
			isThirdParty: false,
			fullName: "João da Silva",
		};

		await sut.execute({ aiSession, messageText: "Meu nome é João da Silva" });

		const history = await chatMemoryProvider.getHistory(
			`${chatId}-recepcao`,
		);
		expect(history).toHaveLength(4);
		expect(history[0].content).toBe("Oi");
		expect(history[1].content).toBe("Olá! Qual seu nome?");
		expect(history[2].content).toBe("Meu nome é João da Silva");
		expect(history[3].content).toBe("João, como posso te ajudar?");
	});

	it("should return error when agent fails", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.shouldFail = true;

		const result = await sut.execute({
			aiSession,
			messageText: "Oi",
		});

		expect(result.isLeft()).toBe(true);

		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(AgentResponseError);
		}
	});

	it("should return error when no workspace is configured", async () => {
		const workspaces = await workspacesRepository.findMany({ page: 1 });
		for (const ws of workspaces.items) {
			await workspacesRepository.delete(ws.id);
		}

		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		const result = await sut.execute({
			aiSession,
			messageText: "Oi",
		});

		expect(result.isLeft()).toBe(true);

		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(WorkspaceNotConfiguredError);
		}
	});

	it("should return error when identified category does not match any screening flow", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "5511999999999@s.whatsapp.net",
			name: "",
			cellphone: "5511999999999",
			chatState: {},
		});

		mockAgent.mockOutput = {
			messageToClient: "Entendi.",
			identifiedCategory: "Categoria Inexistente",
			isThirdParty: false,
			fullName: "João da Silva",
		};

		const result = await sut.execute({
			aiSession,
			messageText: "Tenho um problema diferente",
		});

		expect(result.isLeft()).toBe(true);

		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(ScreeningFlowNotMatchedError);
		}
	});
});
