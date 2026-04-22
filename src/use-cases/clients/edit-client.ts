import { ClientsRepository } from "@/repositories/clients-repository";
import { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { LawyersRepository } from "@/repositories/lawyers-repository";
import { type Either, left, right } from "@/utils/either";
import { Client} from "@generated/prisma/client";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";

interface EditClientUseCaseRequest {
  clientId: string;
  name?: string;
  email?: string;
  cellphone?: string;
  workspaceId?: string;
  lawyerId?: string | null;
}

type EditClientUseCaseResponse = Either<
    ClientNotFoundError | WorkspaceNotFoundError | LawyerNotFoundError,
    { client: Client }>

export class EditClientUseCase {
    constructor(
        private readonly clientsRepository: ClientsRepository,
        private readonly lawyerRepository: LawyersRepository,
        private readonly workspacesRepository: WorkspacesRepository
    ) {}

    async execute({
        clientId,
        name,
        email,
        cellphone,
        workspaceId,
        lawyerId
    }: EditClientUseCaseRequest): Promise<EditClientUseCaseResponse> {
        const client = await this.clientsRepository.findById(clientId);

        if (!client) {
            return left(new ClientNotFoundError(clientId));
        }

        if (workspaceId) {
            const workspace = await this.workspacesRepository.findById(workspaceId);

            if (!workspace) {
                return left(new WorkspaceNotFoundError(workspaceId));
            }
        }

        if (lawyerId !== undefined && lawyerId !== null) {
            const lawyer = await this.lawyerRepository.findById(lawyerId);

            if (!lawyer) {
                return left(new LawyerNotFoundError(lawyerId));
            }
        }

        //client.name = name ?? client.name;
        //client.email = email ?? client.email;
        //client.cellphone = cellphone ?? client.cellphone;
        //client.workspaceId = workspaceId ?? client.workspaceId;
        //client.lawyerId = lawyerId === undefined ? client.lawyerId : lawyerId;

        const updatedClient = await this.clientsRepository.save({
            ...client,
            name: name ?? client.name,
            email: email ?? client.email,
            cellphone: cellphone ?? client.cellphone,
            workspaceId: workspaceId ?? client.workspaceId,
            lawyerId: lawyerId === undefined ? client.lawyerId : lawyerId,
        });

        return right({ client: updatedClient });
    }
}
