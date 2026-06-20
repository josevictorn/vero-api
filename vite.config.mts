import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		dir: "src",
		globals: true,
		root: "./",
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
				},
			},
		],
	},
});
