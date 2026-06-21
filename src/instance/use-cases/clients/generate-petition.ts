import { CalendarGateway } from "@/infra/google/calendar-gateway";
import { DriveDocsGateway } from "@/infra/google/drive-docs-gateway";
import { type Either, left, right } from "@/utils/either";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { LawyerNotFoundError } from "../lawyers/errors/lawyer-not-found-error";
import { GoogleDocsIntegrationError } from "./errors/google-docs-integration-error";
import { ScreeningReportNotFoundError } from "@/core/use-cases/screening-report/errors/screening-report-not-found-error";
import { ensureGoogleAccessToken } from "../calendar/ensure-google-access-token";
import {env} from "@/env";
import { ClientsRepository } from "@/instance/repositories/clients-repository";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";
import { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";

interface GeneratePetitionUseCaseRequest {
    clientId: string;
    userId: string;
    screeningReportId: string;
}

type GeneratePetitionUseCaseResponse = Either<
    | ClientNotFoundError
    | LawyerNotFoundError
    | GoogleDocsIntegrationError
    | ScreeningReportNotFoundError,
	{ petitionUrl: string }
>;

export class GeneratePetitionUseCase {
    constructor(
        private readonly clientsRepository: ClientsRepository,
        private readonly lawyersRepository: LawyersRepository,
        private readonly screeningReportRepository: ScreeningReportRepository,
        private readonly driveDocsGateway: DriveDocsGateway,
        private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
        private readonly calendarGateway: CalendarGateway
    ) {}

    async execute({
        clientId, 
        userId,
        screeningReportId
    }: GeneratePetitionUseCaseRequest): Promise<GeneratePetitionUseCaseResponse> {
        const connection = await this.calendarConnectionsRepository.findByUserId(userId);

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

        const screeningReport = await this.screeningReportRepository.findById(screeningReportId);
        
        if (!screeningReport) {
            return left(new ScreeningReportNotFoundError(screeningReportId));
        }

        // Extrair campos jurídicos do campo `data` genérico
        const reportData = screeningReport.data as Record<string, string>;

        const documentName = `Petição - ${client.name}`;

        const replacements = {
          VARA_CÍVEL_OU_FEDERAL:    "",
          CIDADE_FORO:              client.city,
          ESTADO_FORO:              client.state,

          nome_cliente:             client.name,
          nacionalidade_cliente:    "",
          estado_civil_cliente:     client.maritalStatus,
          profissao_cliente:        client.profession,
          cpf_cliente:              client.cpf,
          rua_cliente:              client.street,
          bairro_cliente:           client.neighborhood,
          cidade_cliente:           client.city,
          estado_cliente:           client.state,
          cep_cliente:              client.zipCode,
          email_cliente:            client.email,

          TITULO_DA_ACAO:           screeningReport.title,

          NOME_REU:                 "",
          qualificacao_reu:         "",
          endereco_reu:             "",

          texto_dos_fatos:          reportData.analysisText ?? "",
          texto_fundamentacao_juridica: reportData.mainLegalBase ?? "",
          interesse_conciliacao:    "",
          texto_dos_pedidos:        "",
          valor_da_causa:           "",

          NOME_ADVOGADO:            lawyer.name,
          estado_oab:               lawyer.oabState,
          oab:                      lawyer.oab,

          data: new Date().toLocaleDateString("pt-BR"),

          NOME_CLIENTE:             client.name,
        };

        try {
            const accessToken = await ensureGoogleAccessToken({
                connection,
                calendarGateway: this.calendarGateway,
                calendarConnectionsRepository: this.calendarConnectionsRepository,
            });

            const { documentUrl } = await this.driveDocsGateway.copyTemplateAndReplace({
                accessToken,
                templateId: env.GOOGLE_PETITION_TEMPLATE_ID,
                documentName,
                replacements,
            });

            return right({ petitionUrl: documentUrl });
        }
        catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return left(new GoogleDocsIntegrationError(message));
		}
    }
}
