import { CalendarGateway } from "@/infra/google/calendar-gateway";
import { DriveDocsGateway } from "@/infra/google/drive-docs-gateway";
import { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { ClientsRepository } from "@/repositories/clients-repository";
import { LawyersRepository } from "@/repositories/lawyers-repository";
import { type Either, left, right } from "@/utils/either";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { LawyerNotFoundError } from "../lawyers/errors/lawyer-not-found-error";
import { GoogleDocsIntegrationError } from "./errors/google-docs-integration-error";
import { CaseAnalysisNotFoundError } from "../case-analysis/errors/case-analysis-not-found-error";
import { ensureGoogleAccessToken } from "../calendar/ensure-google-access-token";
import {env} from "@/env";

interface GeneratePetitionUseCaseRequest {
    clientId: string;
    userId: string;
    caseAnalysisId: string;
}

type GeneratePetitionUseCaseResponse = Either<
    | ClientNotFoundError
    | LawyerNotFoundError
    | GoogleDocsIntegrationError 
    | CaseAnalysisNotFoundError,
	{ petitionUrl: string }
>;

export class GeneratePetitionUseCase {
    constructor(
        private readonly clientsRepository: ClientsRepository,
        private readonly lawyersRepository: LawyersRepository,
        private readonly caseAnalysisRepository: CaseAnalysisRepository,
        private readonly driveDocsGateway: DriveDocsGateway,
        private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
        private readonly calendarGateway: CalendarGateway
    ) {}

    async execute({
        clientId, 
        userId,
        caseAnalysisId
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

        const caseAnalysis = await this.caseAnalysisRepository.findById(caseAnalysisId);
        
        if (!caseAnalysis) {
            return left(new CaseAnalysisNotFoundError(caseAnalysisId));
        }

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

          TITULO_DA_ACAO:           caseAnalysis.title,

          NOME_REU:                 "",
          qualificacao_reu:         "",
          endereco_reu:             "",

          texto_dos_fatos:          caseAnalysis.analysisText,
          texto_fundamentacao_juridica: caseAnalysis.mainLegalBase,
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
