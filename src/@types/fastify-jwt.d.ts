import "@fastify/jwt";
import type { Role } from "@generated/prisma/client";

declare module "@fastify/jwt" {
	export interface FastifyJWT {
		user: {
			sub: string;
			role: Role;
		};
	}
}
