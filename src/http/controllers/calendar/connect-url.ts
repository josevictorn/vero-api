import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { makeGenerateGoogleAuthUrlUseCase } from "@/use-cases/calendar/factories/make-generate-google-auth-url-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetGoogleConnectUrlController: FastifyPluginAsyncZod = async (
	app
) => {
	app.get(
		"/calendar/google/connect-url",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "Generate Google OAuth connection URL",
				response: {
					200: z.object({ auth_url: z.url() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeGenerateGoogleAuthUrlUseCase();
			const result = await useCase.execute({
				userId: request.user.sub,
			});

			return reply.status(HTTP_STATUS.OK).send({
				auth_url: result.value.authUrl,
			});
		}
	);
};
