import { ClientsRepository } from "@/repositories/clients-repository";
import { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { Client } from "@generated/prisma/client";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";
import {UsersRepository} from "@/repositories/users-repository";

interface CreateClientUseCaseRequest {
  name: string;
  email: string;
  cellphone: string;
  workspaceId: string;
  lawyerId?: string | null;
}

type CreateClientUseCaseResponse = Either<
    WorkspaceNotFoundError | LawyerNotFoundError, 
    { client: Client }
>;

export class CreateClientUseCase {
  constructor(
      private readonly clientsRepository: ClientsRepository,
      private readonly workspacesRepository: WorkspacesRepository,
      private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
      name,
      email,
      cellphone,
      workspaceId,
      lawyerId
  }: CreateClientUseCaseRequest): Promise<CreateClientUseCaseResponse> {

     const workspace = await this.workspacesRepository.findById(workspaceId);

     if (!workspace) {
         return left(new WorkspaceNotFoundError(workspaceId));
     }

     if (lawyerId !== undefined && lawyerId !== null) {
         const lawyer = await this.usersRepository.findById(lawyerId);

         if (!lawyer) {
             return left(new LawyerNotFoundError(lawyerId));
         }
     }

     const client = await this.clientsRepository.create({
         name,
         email,
         cellphone,
         workspaceId,
         lawyerId
     })

     return right({ client });
  }
}
