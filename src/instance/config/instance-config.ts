import { right, left } from "@/utils/either";
import type { InstanceConfig } from "@core/config/instance-config.port";
import { GeminiIdentifierAgent } from "@instance/agents/identifier/gemini-identifier-agent";
import { GeminiInterviewerAgent } from "@instance/agents/interviewer/gemini-interviewer-agent";
import { ProcessScreeningAnalyzerAgentUseCase } from "@instance/use-cases/agents/process-screening-analyzer-agent";
import { makeProcessMessageIdentifyingAgentUseCase } from "@/core/use-cases/orchestrator/agents/factories/make-process-message-identifying-agent";
import { makeProcessInterviewInterviewerAgentUseCase } from "@/core/use-cases/orchestrator/agents/factories/make-process-interview-interviewer-agent";

// Status desta instância — definidos aqui para reutilização segura com tipagem
export const LAW_FIRM_STATUS = {
	IDENTIFYING: "IDENTIFYING",
	INTERVIEWING: "INTERVIEWING",
	FORWARDED: "FORWARDED",
	BOOKING: "BOOKING",
	BOOKED: "BOOKED",
} as const;

/**
 * Configuração da instância para escritórios de advocacia.
 *
 * Implementa o contrato `InstanceConfig` do core, fornecendo:
 * - Agentes Gemini com prompts jurídicos
 * - Status e handlers do fluxo de triagem jurídica
 * - Hook pós-triagem para análise jurídica do caso
 */
export function createLawFirmInstanceConfig(): InstanceConfig {
	const analyzerUseCase = new ProcessScreeningAnalyzerAgentUseCase();

	// A config base é montada primeiro (sem statusHandlers que dependem dela própria)
	const baseConfig = {
		workspaceLabel: "escritório de advocacia",
		agents: {
			identifier: new GeminiIdentifierAgent(),
			interviewer: new GeminiInterviewerAgent(),
		},
		terminalStatuses: [LAW_FIRM_STATUS.BOOKED],
		onScreeningCompleted: (ctx) => analyzerUseCase.execute(ctx),
	} satisfies Omit<InstanceConfig, "statusHandlers">;

	// Monta os use cases do core passando a config (sem os handlers ainda)
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
		statusHandlers: {
			/** Identifica o lead e a categoria do caso */
			[LAW_FIRM_STATUS.IDENTIFYING]: async (session, message, ctx) => {
				const result = await identifyingUseCase.execute({
					aiSession: session,
					messageText: message,
				});
				if (result.isLeft()) return left(result.value);
				return right({ reply: result.value.messageToClient });
			},

			/** Realiza a entrevista de triagem */
			[LAW_FIRM_STATUS.INTERVIEWING]: async (session, message, ctx) => {
				const result = await interviewingUseCase.execute({
					aiSession: session,
					messageText: message,
					today: today(),
				});
				if (result.isLeft()) return left(result.value);
				return right({ reply: result.value.messageToClient });
			},

			/** Caso encaminhado ao advogado — silencioso (sem resposta ao lead) */
			[LAW_FIRM_STATUS.FORWARDED]: async () => right({ reply: "" }),

			/** Agendamento em andamento — silencioso */
			[LAW_FIRM_STATUS.BOOKING]: async () => right({ reply: "" }),

			/** Já agendado — silencioso (nova mensagem reiniciará a sessão) */
			[LAW_FIRM_STATUS.BOOKED]: async () => right({ reply: "" }),
		},
	};

	return config;
}

/** Singleton da configuração — use este export nos controllers/webhooks */
export const lawFirmInstanceConfig = createLawFirmInstanceConfig();
