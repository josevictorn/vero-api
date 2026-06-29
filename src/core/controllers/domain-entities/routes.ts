import type { FastifyInstance } from "fastify";
import type { DomainEntityPort } from "@/core/ports/domain-entity.port";
import { makeDomainEntityControllers } from "./domain-entities";

/**
 * Registra as rotas genéricas de entidade de domínio.
 * Deve ser chamado após o `InstanceConfig` estar disponível.
 *
 * @example
 * // src/app.ts
 * app.register(domainEntitiesRoutes(instanceConfig.domainEntity));
 */
export function domainEntitiesRoutes(port: DomainEntityPort) {
	return async (app: FastifyInstance) => {
		await app.register(makeDomainEntityControllers(port));
	};
}
