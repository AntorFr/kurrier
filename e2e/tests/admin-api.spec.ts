import { expect, test } from "@playwright/test";
import { adminApi, seedMailUser } from "../helpers/api";
import { provisionStandardFolders } from "../helpers/mail";

const EMAIL = `api-${Date.now()}@e2e.local`;

test.describe("admin management API", () => {
	test("rejects requests without a key", async () => {
		const r = await adminApi("/smtp-accounts", "GET", undefined, null);
		expect(r.status).toBe(401);
	});

	test("rejects a bogus key", async () => {
		const r = await adminApi(
			"/smtp-accounts",
			"GET",
			undefined,
			"sk_bogus.aaaaaaaa",
		);
		expect(r.status).toBe(401);
	});

	test("provisions a user with mailbox end to end, idempotently", async () => {
		await provisionStandardFolders(EMAIL);

		const first = await seedMailUser(EMAIL);
		expect(first.user.created).toBe(true);
		expect(first.identityStatus).toBe(200);
		expect(first.backfill).toBe("completed");

		// idempotent on email
		const again = await adminApi("/users", "POST", { email: EMAIL });
		expect(again.status).toBe(200);
		expect(again.json.data.created).toBe(false);

		// duplicate identity is refused cleanly
		const dup = await adminApi("/identities", "POST", {
			userEmail: EMAIL,
			value: EMAIL,
			smtpAccountId: first.smtpAccountId,
		});
		expect(dup.status).toBe(409);

		// listing on behalf works and never leaks passwords
		const list = await adminApi(
			`/smtp-accounts?userEmail=${encodeURIComponent(EMAIL)}`,
		);
		expect(list.status).toBe(200);
		const account = list.json.data.find(
			(a: any) => a.smtp?.username === EMAIL,
		);
		expect(account).toBeTruthy();
		expect(account.imap?.host).toBeTruthy();
		expect(JSON.stringify(list.json)).not.toContain("e2e-password");

		// deleting an account still referenced by an identity is refused
		const del = await adminApi(`/smtp-accounts/${first.smtpAccountId}`, "DELETE");
		expect(del.status).toBe(409);
	});
});
