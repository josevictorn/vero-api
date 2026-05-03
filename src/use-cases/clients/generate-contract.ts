import type { CalendarGateway } from "@/infra/google/calendar-gateway";
import type { DriveDocsGateway } from "@/infra/google/drive-docs-gateway";
import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import type { ClientsRepository } from "@/repositories/clients-repository";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { ensureGoogleAccessToken } from "@/use-cases/calendar/ensure-google-access-token";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "../lawyers/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { GoogleDocsIntegrationError } from "./errors/google-docs-integration-error";

interface GenerateContractUseCaseRequest {
	clientId: string;
	userId: string;
}

type GenerateContractUseCaseResponse = Either<
	| ClientNotFoundError
	| LawyerNotFoundError
	| WorkspaceNotFoundError
	| GoogleDocsIntegrationError,
	{ contractUrl: string }
>;

export class GenerateContractUseCase {
	constructor(
		private readonly clientsRepository: ClientsRepository,
		private readonly lawyersRepository: LawyersRepository,
		private readonly workspacesRepository: WorkspacesRepository,
		private readonly driveDocsGateway: DriveDocsGateway,
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		clientId,
		userId,
	}: GenerateContractUseCaseRequest): Promise<GenerateContractUseCaseResponse> {
		const connection =
			await this.calendarConnectionsRepository.findByUserId(userId);

		if (!connection) {
			return left(
				new GoogleDocsIntegrationError("User has no Google Docs connection")
			);
		}

		const client = await this.clientsRepository.findById(clientId);

		if (!client) {
			return left(new ClientNotFoundError(clientId));
		}

		if (client.lawyerId === null) {
			return left(new LawyerNotFoundError("null"));
		}

		const lawyer = await this.lawyersRepository.findById(client.lawyerId);

		if (!lawyer) {
			return left(new LawyerNotFoundError(client.lawyerId));
		}

		const workspace = await this.workspacesRepository.findById(
			client.workspaceId
		);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(client.workspaceId));
		}

		const documentName = `Contrato - ${client.name}`;
		const replacements = {
			nome_cliente: client.name,
			estado_civil: client.maritalStatus,
			profissao: client.profession,
			rg: client.rg,
			orgao_emissor: client.issuingAgency,
			cpf: client.cpf,
			rua: client.street,
			bairro: client.neighborhood,
			cidade: client.city,
			estado: client.state,
			cep: client.zipCode,
			telefone: client.cellphone,
			email: client.email,
			nome_advogado: lawyer.name,
			estado_civil_advogado: "",
			estado_oab: lawyer.oabState,
			oab: lawyer.oab,
			pix_advogado: lawyer.pix,
			nome_escritorio: workspace.name,
			cnpj_escritorio: workspace.cnpj,
		};

		try {
			const accessToken = await ensureGoogleAccessToken({
				connection,
				calendarGateway: this.calendarGateway,
				calendarConnectionsRepository: this.calendarConnectionsRepository,
			});

			const { documentUrl } =
				await this.driveDocsGateway.copyTemplateAndReplace({
					accessToken,
					documentName,
					replacements,
				});

			return right({ contractUrl: documentUrl });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return left(new GoogleDocsIntegrationError(message));
		}
	}
}
