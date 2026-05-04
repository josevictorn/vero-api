import "dotenv/config";
import { z } from "zod";

const DEFAULT_PORT = 3333;

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
	PORT: z.coerce.number().default(DEFAULT_PORT),
	JWT_SECRET: z.string(),
	DATABASE_URL: z.url(),
	DATABASE_SCHEMA: z.string().default("public"),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GOOGLE_OAUTH_REDIRECT_URI: z.url(),
	GOOGLE_OAUTH_STATE_SECRET: z.string(),
	GOOGLE_FOLDER_ID: z.string(),
	GOOGLE_TEMPLATE_ID: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	throw new Error(
		`Invalid environment variables: ${JSON.stringify(z.flattenError(_env.error))}`
	);
}

export const env = _env.data;
