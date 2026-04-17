import { FastifyInstance } from "fastify";
import { CreateCaseAnalysisController } from "./create";
import { DeleteCaseAnalysisController } from "./delete";
import { EditCaseAnalysisController } from "./edit";
import { FetchCaseAnalysisController } from "./fetch";
import { GetCaseAnalysisController } from "./get";

export async function caseAnalysisRoutes(app: FastifyInstance) {
	await app.register(CreateCaseAnalysisController);
	await app.register(FetchCaseAnalysisController);
	await app.register(GetCaseAnalysisController);
	await app.register(EditCaseAnalysisController);
	await app.register(DeleteCaseAnalysisController);
}