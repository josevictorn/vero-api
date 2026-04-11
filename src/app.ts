import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import z, { ZodError } from "zod";
import { env } from "./env";
import { usersRoutes } from "./http/controllers/users/routes";
import { HTTP_STATUS } from "./utils/constants";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
	origin: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
});

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Vero API",
			version: "1.0.0",
		},
	},
	transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
});

app.register(usersRoutes);

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
