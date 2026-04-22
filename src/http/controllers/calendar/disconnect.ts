import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CalendarConnectionNotFoundError } from "@/use-cases/calendar/errors/calendar-connection-not-found-error";
import { makeDisconnectGoogleCalendarUseCase } from "@/use-cases/calendar/factories/make-disconnect-google-calendar-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DisconnectGoogleCalendarController: FastifyPluginAsyncZod = async (
	app
) => {
	app.delete(
		"/calendar/google/disconnect",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "Disconnect Google Calendar",
				response: {
					204: z.null(),
					404: z.object({ message: z.string() }),
					400: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeDisconnectGoogleCalendarUseCase();
			const result = await useCase.execute({ userId: request.user.sub });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case CalendarConnectionNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
		}
	);
};
