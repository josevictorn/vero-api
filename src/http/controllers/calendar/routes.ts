import type { FastifyInstance } from "fastify";
import { GoogleCallbackController } from "./callback";
import { GetGoogleConnectUrlController } from "./connect-url";
import { CreateCalendarEventController } from "./create-event";
import { DeleteCalendarEventController } from "./delete-event";
import { DisconnectGoogleCalendarController } from "./disconnect";
import { EditCalendarEventController } from "./edit-event";
import { FetchCalendarEventsController } from "./fetch-events";
import { GetCalendarEventController } from "./get-event";

export async function calendarRoutes(app: FastifyInstance) {
	await app.register(GetGoogleConnectUrlController);
	await app.register(GoogleCallbackController);
	await app.register(DisconnectGoogleCalendarController);
	await app.register(FetchCalendarEventsController);
	await app.register(GetCalendarEventController);
	await app.register(CreateCalendarEventController);
	await app.register(EditCalendarEventController);
	await app.register(DeleteCalendarEventController);
}
