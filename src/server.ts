import { app } from "./app";
import { env } from "./env";

app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
	console.log("🚀  HTTP server is running on http://localhost:3333");
	console.log("Docs available at http://localhost:3333/docs");
});
