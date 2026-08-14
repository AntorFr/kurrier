import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 90_000,
	expect: { timeout: 15_000 },
	retries: 0,
	// Mail state is shared (one greenmail, one DB): keep tests sequential.
	workers: 1,
	use: {
		baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
		trace: "retain-on-failure",
	},
});
