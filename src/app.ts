import { usersRoutes } from "@/core/controllers/users/routes";
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
// --- Framework (core) routes ---
import { aiSessionsRoutes } from "@/core/controllers/ai-sessions/routes";
import { screeningFlowsRoutes } from "@/core/controllers/screening-flows/routes";
import { workspacesRoutes } from "@/core/controllers/workspaces/routes";
import { leadsRoutes } from "@/core/controllers/leads/routes";
import { webhooksRoutes } from "@/core/controllers/webhooks/routes";
import { passwordRoutes } from "@/core/controllers/password/routes";
import { domainEntitiesRoutes } from "@/core/controllers/domain-entities/routes";
// --- Instance (Vero) routes ---
import { lawyersRoutes } from "@/http/controllers/lawyers/routes";
import { screeningReportsRoutes } from "@/core/controllers/screening-reports/routes";
import { calendarRoutes } from "@/http/controllers/calendar/routes";
import { lawFirmInstanceConfig } from "@instance/config/instance-config";

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
app.register(calendarRoutes);
app.register(aiSessionsRoutes);
app.register(screeningReportsRoutes);
app.register(lawyersRoutes);
app.register(webhooksRoutes);
app.register(passwordRoutes);
// Rotas genéricas de entidade de domínio (CRUD via DomainEntityPort da instância)
if (lawFirmInstanceConfig.domainEntity) {
	app.register(domainEntitiesRoutes(lawFirmInstanceConfig.domainEntity));
}

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
