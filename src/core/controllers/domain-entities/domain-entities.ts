import { z } from "zod";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import type { DomainEntityPort } from "@/core/ports/domain-entity.port";
import { FetchDomainEntitiesUseCase } from "@/core/use-cases/domain-entity/fetch-domain-entities";
import { InvalidPageError } from "@/core/use-cases/leads/errors/invalid-page-error";
import { GetDomainEntityUseCase } from "@/core/use-cases/domain-entity/get-domain-entity";
import { UpdateDomainEntityUseCase } from "@/core/use-cases/domain-entity/update-domain-entity";
import { DeleteDomainEntityUseCase } from "@/core/use-cases/domain-entity/delete-domain-entity";
import { DomainEntityNotFoundError } from "@/core/use-cases/domain-entity/errors/domain-entity-not-found-error";

const pageQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1) });
const idParamSchema = z.object({ id: z.string().uuid() });
const leadIdParamSchema = z.object({ leadId: z.string().uuid() });

/**
 * Registra as rotas genéricas de entidade de domínio.
 * As rotas são agrupadas no Swagger pela `entityTag` definida no port da instância.
 *
 * @example
 * // LawFirmDomainEntityPort.entityTag = "clients"  → tag: ["clients"]
 * // ClinicDomainEntityPort.entityTag  = "patients" → tag: ["patients"]
 */
export function makeDomainEntityControllers(port: DomainEntityPort) {
	const { entityTag } = port;

	return async (app: FastifyInstance) => {
		// GET /entities?page=1
		app.get(
			"/entities",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: [entityTag],
					summary: `Fetch paginated list of ${entityTag}`,
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const query = pageQuerySchema.parse(request.query);
				const useCase = new FetchDomainEntitiesUseCase(port);
				const result = await useCase.execute({ page: query.page });

				if (result.isLeft()) {
					if (result.value instanceof InvalidPageError) {
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({ message: result.value.message });
					}
					return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}

				return reply.status(HTTP_STATUS.OK).send(result.value);
			},
		);

		// GET /entities/lead/:leadId — must come before /entities/:id
		app.get(
			"/entities/lead/:leadId",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: [entityTag],
					summary: `Get ${entityTag.replace(/s$/, "")} by Lead ID`,
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const { leadId } = leadIdParamSchema.parse(request.params);
				const entity = await port.findByLeadId(leadId);

				if (!entity) {
					return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: `${entityTag.replace(/s$/, "")} for lead "${leadId}" not found.` });
				}

				return reply.status(HTTP_STATUS.OK).send(entity);
			},
		);

		// GET /entities/:id
		app.get(
			"/entities/:id",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: [entityTag],
					summary: `Get ${entityTag.replace(/s$/, "")} by ID`,
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const { id } = idParamSchema.parse(request.params);
				const useCase = new GetDomainEntityUseCase(port);
				const result = await useCase.execute({ id });

				if (result.isLeft()) {
					if (result.value instanceof DomainEntityNotFoundError) {
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: result.value.message });
					}
					return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}

				return reply.status(HTTP_STATUS.OK).send(result.value.entity);
			},
		);

		// PUT /entities/:id — body livre; a instância valida os campos que reconhece
		app.put(
			"/entities/:id",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: [entityTag],
					summary: `Update ${entityTag.replace(/s$/, "")} by ID`,
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const { id } = idParamSchema.parse(request.params);
				const data = request.body as Record<string, unknown>;
				const useCase = new UpdateDomainEntityUseCase(port);
				const result = await useCase.execute({ id, data });

				if (result.isLeft()) {
					if (result.value instanceof DomainEntityNotFoundError) {
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: result.value.message });
					}
					return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: result.value.message ?? "An unexpected error occurred." });
				}

				return reply.status(HTTP_STATUS.OK).send(result.value.entity);
			},
		);

		// DELETE /entities/:id
		app.delete(
			"/entities/:id",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: [entityTag],
					summary: `Delete ${entityTag.replace(/s$/, "")} by ID`,
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const { id } = idParamSchema.parse(request.params);
				const useCase = new DeleteDomainEntityUseCase(port);
				const result = await useCase.execute({ id });

				if (result.isLeft()) {
					if (result.value instanceof DomainEntityNotFoundError) {
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: result.value.message });
					}
					return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}

				return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
			},
		);
	};
}
