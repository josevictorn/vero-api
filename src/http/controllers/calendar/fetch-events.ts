import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CalendarConnectionNotFoundError } from "@/use-cases/calendar/errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "@/use-cases/calendar/errors/google-calendar-integration-error";
import { makeFetchCalendarEventsUseCase } from "@/use-cases/calendar/factories/make-fetch-calendar-events-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const MAX_EVENTS_PER_REQUEST = 50;

export const FetchCalendarEventsController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/calendar/events",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "List Google Calendar events",
				querystring: z.object({
					timeMin: z.iso.datetime().optional(),
					timeMax: z.iso.datetime().optional(),
					maxResults: z.coerce
						.number()
						.int()
						.positive()
						.max(MAX_EVENTS_PER_REQUEST)
						.optional(),
				}),
				response: {
					200: z.object({
						events: z.array(
							z.object({
								id: z.string(),
								summary: z.string(),
								description: z.string().nullable(),
								starts_at: z.date(),
								ends_at: z.date(),
								hangout_link: z.string().nullable(),
							})
						),
					}),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeFetchCalendarEventsUseCase();
			const result = await useCase.execute({
				userId: request.user.sub,
				timeMin: request.query.timeMin ? new Date(request.query.timeMin) : undefined,
				timeMax: request.query.timeMax ? new Date(request.query.timeMax) : undefined,
				maxResults: request.query.maxResults,
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

			return reply.status(HTTP_STATUS.OK).send({
				events: result.value.events.map((event) => ({
					id: event.id,
					summary: event.summary,
					description: event.description,
					starts_at: event.startsAt,
					ends_at: event.endsAt,
					hangout_link: event.hangoutLink,
				})),
			});
		}
	);
};
