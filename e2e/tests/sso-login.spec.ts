import { expect, test } from "@playwright/test";
import { ssoLogin } from "../helpers/sso";

test.describe("generic OIDC login", () => {
	test("first login provisions; returning login maps by issuer+sub, not email", async ({
		browser,
	}) => {
		const sub = `sub-${Date.now()}`;

		const ctx1 = await browser.newContext();
		const p1 = await ctx1.newPage();
		await ssoLogin(p1, sub, {
			email: `sso-${Date.now()}@e2e.local`,
			email_verified: true,
		});
		await p1.waitForURL(/\/w\/.+\/dashboard\//);
		const ws1 = p1.url().match(/\/w\/([^/]+)\//)?.[1];
		expect(ws1).toBeTruthy();
		await ctx1.close();

		// Same sub, different email: must land on the SAME Kurrier user —
		// the auth account (issuer+sub) is authoritative.
		const ctx2 = await browser.newContext();
		const p2 = await ctx2.newPage();
		await ssoLogin(p2, sub, {
			email: `changed-${Date.now()}@e2e.local`,
			email_verified: true,
		});
		await p2.waitForURL(/\/w\/.+\/dashboard\//);
		const ws2 = p2.url().match(/\/w\/([^/]+)\//)?.[1];
		expect(ws2).toBe(ws1);
		await ctx2.close();
	});

	test("unverified email cannot provision or link", async ({ browser }) => {
		const ctx = await browser.newContext();
		const p = await ctx.newPage();
		await ssoLogin(p, `unverified-${Date.now()}`, {
			email: `u-${Date.now()}@e2e.local`,
			email_verified: false,
		});
		await expect(p).toHaveURL(/\/auth\/login/);
		await ctx.close();
	});
});
