import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { GoogleCalendarIntegrationError } from "@/use-cases/calendar/errors/google-calendar-integration-error";
import { InvalidOAuthStateError } from "@/use-cases/calendar/errors/invalid-oauth-state-error";
import { makeConnectGoogleCalendarUseCase } from "@/use-cases/calendar/factories/make-connect-google-calendar-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GoogleCallbackController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/calendar/google/callback",
		{
			schema: {
				tags: ["calendar"],
				summary: "Google OAuth callback",
				querystring: z.object({
					code: z.string().min(1),
					state: z.string().min(1),
				}),
				response: {
					200: z.object({ connected: z.boolean(), google_email: z.email() }),
					400: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { code, state } = request.query;
			const useCase = makeConnectGoogleCalendarUseCase();
			const result = await useCase.execute({ code, state });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case InvalidOAuthStateError:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: error.message,
						});
					case GoogleCalendarIntegrationError:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.OK).send({
				connected: true,
				google_email: result.value.connection.googleEmail,
			});
		}
	);
};
