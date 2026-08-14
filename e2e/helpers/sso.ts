import type { Page } from "@playwright/test";

/**
 * Drives a full authorization-code login through the mock OIDC server
 * (docker-compose.e2e.yml). `sub` is the stable external identity; extra
 * claims (email, email_verified, ...) are injected through the mock's
 * interactive form.
 */
export async function ssoLogin(
	page: Page,
	sub: string,
	claims: Record<string, unknown>,
) {
	await page.goto("/en/auth/login");
	await page.getByRole("link", { name: /E2E SSO/i }).click();
	await page.waitForURL(/localhost:8091/);
	await page.fill('input[name="username"]', sub);
	await page.fill('textarea[name="claims"]', JSON.stringify(claims));
	await page.locator('button[type="submit"], input[type="submit"]').first().click();
	await page.waitForURL(/localhost:3000/);
}
