import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CalendarConnectionNotFoundError } from "@/use-cases/calendar/errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "@/use-cases/calendar/errors/google-calendar-integration-error";
import { makeDeleteCalendarEventUseCase } from "@/use-cases/calendar/factories/make-delete-calendar-event-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteCalendarEventController: FastifyPluginAsyncZod = async (
	app
) => {
	app.delete(
		"/calendar/events/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "Delete a Google Calendar event",
				params: z.object({
					id: z.string().min(1),
				}),
				response: {
					204: z.null(),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeDeleteCalendarEventUseCase();
			const result = await useCase.execute({
				userId: request.user.sub,
				eventId: request.params.id,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case CalendarConnectionNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
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

			return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
		}
	);
};
