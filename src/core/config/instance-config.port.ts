import type { AiSession } from "@generated/prisma/client";
import type { IdentifierAgent } from "@core/agents/ports/identifier-agent.port";
import type { InterviewerAgent } from "@core/agents/ports/interviewer-agent.port";
import type { StatusHandlerMap } from "@core/orchestrator/session-status-handler";
import type { CollectedDataItem } from "@core/agents/types/collected-data-item";

/**
 * Contexto fornecido ao hook `onScreeningCompleted` após o agente entrevistador
 * concluir a coleta de dados com o lead.
 */
export interface ScreeningCompletedContext {
	aiSession: AiSession;
	leadId: string;
	contactName: string;
	collectedData: CollectedDataItem[];
	today: string;
}

/**
 * Contrato que cada instância do framework deve implementar.
 *
 * O `InstanceConfig` é o único ponto de extensão do core:
 * ele encapsula todos os aspectos variáveis de cada app (advocacia, clínica, construtora, etc.)
 * sem que o core precise conhecer nenhum detalhe de domínio específico.
 *
 * @example
 * // src/instance/config/instance-config.ts
 * export const instanceConfig: InstanceConfig = {
 *   workspaceLabel: "escritório de advocacia",
 *   agents: { identifier: new GeminiIdentifierAgent(), interviewer: new GeminiInterviewerAgent() },
 *   terminalStatuses: ["BOOKED"],
 *   statusHandlers: { IDENTIFYING: ..., INTERVIEWING: ..., BOOKED: ... },
 *   onScreeningCompleted: async (ctx) => { ... },
 * };
 */
export interface InstanceConfig {
	/**
	 * Label do tipo de workspace usado nos prompts dos agentes.
	 * @example "escritório de advocacia" | "clínica médica" | "construtora civil"
	 */
	workspaceLabel: string;

	/** Implementações dos agentes de IA fornecidas pela instância. */
	agents: {
		identifier: IdentifierAgent;
		interviewer: InterviewerAgent;
	};

	/**
	 * Lista de status que indicam que a sessão está encerrada.
	 * Quando o status atual da sessão estiver nesta lista,
	 * a próxima mensagem do mesmo contato reiniciará a sessão.
	 * @example ["BOOKED"] | ["COMPLETED", "DISCHARGED"]
	 */
	terminalStatuses: string[];

	/**
	 * Mapa de status → handler que define todos os status suportados
	 * por esta instância e como cada um responde a uma mensagem recebida.
	 * Permite à instância registrar handlers simples (e.g. status silenciosos)
	 * e handlers complexos que delegam para use cases do core.
	 */
	statusHandlers: StatusHandlerMap;

	/**
	 * Hook opcional chamado pelo core imediatamente após o agente entrevistador
	 * concluir a triagem (quando `screeningCompleted === true`).
	 *
	 * Use este hook para executar lógicas específicas do domínio:
	 * - Advocacia: gerar análise jurídica do caso
	 * - Clínica: gerar ficha do paciente
	 * - Construtora: criar orçamento preliminar
	 */
	onScreeningCompleted?: (ctx: ScreeningCompletedContext) => Promise<void>;
}
