import type { FastifyInstance } from "fastify";
import { CreateScreeningReportController } from "./create";
import { DeleteScreeningReportController } from "./delete";
import { EditScreeningReportController } from "./edit";
import { FetchScreeningReportsController } from "./fetch";
import { GetScreeningReportController } from "./get";

export async function screeningReportsRoutes(app: FastifyInstance) {
	await app.register(CreateScreeningReportController);
	await app.register(FetchScreeningReportsController);
	await app.register(GetScreeningReportController);
	await app.register(EditScreeningReportController);
	await app.register(DeleteScreeningReportController);
}
