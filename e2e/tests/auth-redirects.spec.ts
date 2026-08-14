import { expect, test } from "@playwright/test";

test.describe("signed-in and signed-out redirects", () => {
	test("root paths land signed-out visitors on the login page", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/auth\/login/);

		await page.goto("/en/");
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("signup, then root and login page route into the workspace", async ({
		page,
	}) => {
		const email = `signup-${Date.now()}@e2e.local`;

		await page.goto("/en/auth/signup");
		await page.fill("#email", email);
		await page.fill("#password", "Password!234");
		await page.fill("#retypePassword", "Password!234");
		await page.fill("#workspaceName", "E2E WS");
		await page.locator('button[type="submit"]').click();

		await page.waitForURL(/\/dashboard\//);

		// the regression: these used to 404 (bare /dashboard/... URL) or crash
		// (cookie writes during layout render)
		await page.goto("/");
		await expect(page).toHaveURL(/\/w\/.+\/dashboard\//);

		await page.goto("/en/auth/login");
		await expect(page).toHaveURL(/\/w\/.+\/dashboard\//);
	});
});
