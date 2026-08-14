import { expect, Page, test } from "@playwright/test";
import { seedMailUser } from "../helpers/api";
import { provisionStandardFolders, sendMail } from "../helpers/mail";
import { ssoLogin } from "../helpers/sso";

const EMAIL = `mbox-${Date.now()}@e2e.local`;
const SUBJECT = `sujet e2e ${Date.now()}`;

// The row may arrive through IDLE with a small delay; reload + sync until it shows.
async function waitForRow(page: Page, text: string) {
	for (let attempt = 0; attempt < 12; attempt++) {
		const visible = await page
			.getByText(text)
			.first()
			.waitFor({ state: "visible", timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (visible) return;
		await page
			.locator('button[title="Sync"], [title="Sync"]')
			.first()
			.click()
			.catch(() => {});
		await page.waitForTimeout(2_000);
		await page.reload();
	}
	await expect(page.getByText(text).first()).toBeVisible();
}

test.describe("mailbox flows against a real IMAP server", () => {
	test.beforeAll(async () => {
		await provisionStandardFolders(EMAIL);
		const seeded = await seedMailUser(EMAIL);
		expect(seeded.backfill).toBe("completed");
		// Give the IDLE loop a moment to arm before delivering, so the
		// message lands either in the backfill or the live-sync window.
		await new Promise((r) => setTimeout(r, 4_000));
		await sendMail({
			from: "sender@e2e.local",
			to: EMAIL,
			subject: SUBJECT,
			body: "bonjour depuis greenmail",
		});
	});

	test("sync, open thread, back to inbox, archive, find in Archive", async ({
		page,
	}) => {
		test.setTimeout(240_000);
		// First SSO login attaches to the pre-provisioned user by email:
		// the mailbox is already wired before the user ever signed in.
		await ssoLogin(page, EMAIL, { email: EMAIL, email_verified: true });
		await page.waitForURL(/\/dashboard\//);

		// The default identity routes the login straight to the inbox.
		await page.waitForURL(/\/inbox/);
		await waitForRow(page, SUBJECT);

		// Open the thread… (the list keeps a hidden snippet with the same
		// text, so assert on a visible occurrence, not DOM order)
		await page.getByText(SUBJECT).first().click();
		await page.waitForURL(/\/threads\//);
		await expect(
			page
				.getByText("bonjour depuis greenmail")
				.filter({ visible: true })
				.first(),
		).toBeVisible();

		// …and navigate back via the sidebar: the viewer must clear
		// (retained parallel-route slot) and the list must be back. With the
		// slot correctly unmounted only the list snippet remains — a stale
		// slot would keep a second copy of the body text around.
		await page.locator('a[href$="/inbox"]').first().click();
		await page.waitForURL(/\/inbox$/);
		await expect(page.getByText("bonjour depuis greenmail")).toHaveCount(1);
		await expect(page.getByText(SUBJECT).first()).toBeVisible();

		// Archive from the row actions: disappears immediately (optimistic)…
		const row = page.locator("li", { hasText: SUBJECT }).first();
		await row.hover();
		await row.locator('button[title="Archive"]').click();
		await expect(page.getByText(SUBJECT)).toHaveCount(0);

		// …and shows up in the Archive folder (removal is scoped to the
		// source mailbox).
		await page.locator('a[href$="/archive"]').first().click();
		await page.waitForURL(/\/archive$/);
		await waitForRow(page, SUBJECT);
	});
});
