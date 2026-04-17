import { usersRoutes } from "@controllers/users/routes";
import { fastifyCors } from "@fastify/cors";
import { fastifyJwt } from "@fastify/jwt";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { HTTP_STATUS } from "@utils/constants";
import { fastify } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import z, { ZodError } from "zod";
import { env } from "@/env";
import { screeningFlowsRoutes } from "@/http/controllers/screening-flows/routes";
import { workspacesRoutes } from "@/http/controllers/workspaces/routes";
import { aiSessionsRoutes } from "@/http/controllers/ai-sessions/routes";
import { caseAnalysisRoutes } from "@/http/controllers/case-analysis/routes";
import { lawyersRoutes } from "./http/controllers/lawyers/routes";
import { leadsRoutes } from "./http/controllers/leads/routes";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
	sign: {
		expiresIn: "10m",
	},
});

app.register(fastifyCors, {
	origin: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
});

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Vero API",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
});

app.register(usersRoutes);
app.register(workspacesRoutes);
app.register(leadsRoutes);
app.register(screeningFlowsRoutes);
app.register(aiSessionsRoutes);
app.register(caseAnalysisRoutes);
app.register(lawyersRoutes);

app.setErrorHandler((error, _, reply) => {
	if (hasZodFastifySchemaValidationErrors(error)) {
		return reply.status(HTTP_STATUS.BAD_REQUEST).send({
			message: "Validation error.",
			issues: error.validation.map((issue) => ({
				message: issue.message,
			})),
		});
	}

	if (error instanceof ZodError) {
		return reply.status(HTTP_STATUS.BAD_REQUEST).send({
			message: "Validation error.",
			issues: z.treeifyError(error),
		});
	}

	if (env.NODE_ENV === "production") {
		// TODO: Here we should log to an external tool like DataDog/NewRelic/Sentry
	} else {
		console.error(error);
	}

	return reply
		.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
		.send({ message: "Internal server error." });
});

export { app };
