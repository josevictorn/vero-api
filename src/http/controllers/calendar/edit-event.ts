import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CalendarConnectionNotFoundError } from "@/use-cases/calendar/errors/calendar-connection-not-found-error";
import { CalendarEventNotFoundError } from "@/use-cases/calendar/errors/calendar-event-not-found-error";
import { GoogleCalendarIntegrationError } from "@/use-cases/calendar/errors/google-calendar-integration-error";
import { makeEditCalendarEventUseCase } from "@/use-cases/calendar/factories/make-edit-calendar-event-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const EditCalendarEventController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/calendar/events/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "Edit a Google Calendar event",
				params: z.object({
					id: z.string().min(1),
				}),
				body: z.object({
					summary: z.string().min(1).optional(),
					description: z.string().optional(),
					starts_at: z.iso.datetime().optional(),
					ends_at: z.iso.datetime().optional(),
					time_zone: z.string().optional(),
				}),
				response: {
					200: z.object({
						event: z.object({
							id: z.string(),
							summary: z.string(),
							description: z.string().nullable(),
							starts_at: z.date(),
							ends_at: z.date(),
							hangout_link: z.string().nullable(),
						}),
					}),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeEditCalendarEventUseCase();
			const result = await useCase.execute({
				userId: request.user.sub,
				eventId: request.params.id,
				summary: request.body.summary,
				description: request.body.description,
				startsAt: request.body.starts_at
					? new Date(request.body.starts_at)
					: undefined,
				endsAt: request.body.ends_at ? new Date(request.body.ends_at) : undefined,
				timeZone: request.body.time_zone,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case CalendarConnectionNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case CalendarEventNotFoundError:
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
				event: {
					id: result.value.event.id,
					summary: result.value.event.summary,
					description: result.value.event.description,
					starts_at: result.value.event.startsAt,
					ends_at: result.value.event.endsAt,
					hangout_link: result.value.event.hangoutLink,
				},
			});
		}
	);
};
