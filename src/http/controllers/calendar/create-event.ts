import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeCreateCalendarEventWithMeetUseCase } from "@/instance/use-cases/calendar/factories/make-create-calendar-event-with-meet-use-case";
import { CalendarConnectionNotFoundError } from "@/instance/use-cases/calendar/errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "@/instance/use-cases/calendar/errors/google-calendar-integration-error";

export const CreateCalendarEventController: FastifyPluginAsyncZod = async (
	app
) => {
	app.post(
		"/calendar/events",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["calendar"],
				summary: "Create a Google Calendar event with Meet link",
				body: z.object({
					summary: z.string().min(1),
					description: z.string().optional(),
					starts_at: z.iso.datetime(),
					ends_at: z.iso.datetime(),
					time_zone: z.string().optional(),
				}),
				response: {
					201: z.object({
						event_id: z.string(),
						hangout_link: z.string().nullable(),
					}),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const useCase = makeCreateCalendarEventWithMeetUseCase();
			const result = await useCase.execute({
				userId: request.user.sub,
				summary: request.body.summary,
				description: request.body.description,
				startsAt: new Date(request.body.starts_at),
				endsAt: new Date(request.body.ends_at),
				timeZone: request.body.time_zone,
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

			return reply.status(HTTP_STATUS.CREATED).send({
				event_id: result.value.event.id,
				hangout_link: result.value.event.hangoutLink,
			});
		}
	);
};
