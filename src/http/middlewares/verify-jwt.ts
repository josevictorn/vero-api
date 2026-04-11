import type { FastifyReply, FastifyRequest } from "fastify";
import { HTTP_STATUS } from "@/utils/constants";

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
	try {
		await request.jwtVerify();
	} catch (err) {
		return reply
			.status(HTTP_STATUS.UNAUTHORIZED)
			.send({ message: "Unauthorized" });
	}
}
