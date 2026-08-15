import { expect, Page, test } from "@playwright/test";
import { seedMailUser } from "../helpers/api";
import { provisionStandardFolders, sendMail } from "../helpers/mail";
import { ssoLogin } from "../helpers/sso";

const EMAIL = `thread-${Date.now()}@e2e.local`;
const STAMP = Date.now();
const SUBJECT = `projet fusée ${STAMP}`;
const OTHER_SUBJECT = `courses du samedi ${STAMP}`;

async function syncUntil(page: Page, predicate: () => Promise<boolean>) {
	for (let attempt = 0; attempt < 12; attempt++) {
		if (await predicate()) return true;
		await page
			.locator('button[title="Sync"], [title="Sync"]')
			.first()
			.click()
			.catch(() => {});
		await page.waitForTimeout(2_000);
		await page.reload();
	}
	return predicate();
}

test.describe("conversation grouping", () => {
	test.beforeAll(async () => {
		await provisionStandardFolders(EMAIL);
		const seeded = await seedMailUser(EMAIL);
		expect(seeded.backfill).toBe("completed");
		await new Promise((r) => setTimeout(r, 4_000));

		// A: thread starter
		await sendMail({
			from: "alice@e2e.local",
			to: EMAIL,
			subject: SUBJECT,
			body: "corps message A",
			messageId: `A-${STAMP}@e2e.local`,
		});
		// B: proper reply with headers
		await sendMail({
			from: "bob@e2e.local",
			to: EMAIL,
			subject: `Re: ${SUBJECT}`,
			body: "corps message B",
			messageId: `B-${STAMP}@e2e.local`,
			inReplyTo: `A-${STAMP}@e2e.local`,
		});
		// C: same subject, NO reply headers (broken client / mailing list)
		await sendMail({
			from: "carol@e2e.local",
			to: EMAIL,
			subject: `RE: ${SUBJECT}`,
			body: "corps message C",
			messageId: `C-${STAMP}@e2e.local`,
		});
		// D: reply to a parent that does not exist yet (out-of-order)
		await sendMail({
			from: "dave@e2e.local",
			to: EMAIL,
			subject: OTHER_SUBJECT,
			body: "corps message D reponse",
			messageId: `D-${STAMP}@e2e.local`,
			inReplyTo: `P-${STAMP}@e2e.local`,
		});
		// E: unrelated conversation, same era
		await sendMail({
			from: "eve@e2e.local",
			to: EMAIL,
			subject: `sans rapport ${STAMP}`,
			body: "corps message E",
			messageId: `E-${STAMP}@e2e.local`,
		});
	});

	test("replies, subject fallback and late parents fold into one conversation", async ({
		page,
	}) => {
		test.setTimeout(240_000);

		await ssoLogin(page, EMAIL, { email: EMAIL, email_verified: true });
		await page.waitForURL(/\/inbox/);

		// A+B+C must collapse into ONE row wearing the ×3 badge.
		const grouped = await syncUntil(page, async () => {
			const rows = page.locator("li", { hasText: SUBJECT });
			if ((await rows.count()) !== 1) return false;
			return (await rows.first().getByText("3", { exact: true }).count()) > 0;
		});
		expect(grouped, "A+B+C should form a single 3-message thread").toBe(true);

		// The unrelated message stays its own row.
		await expect(page.locator("li", { hasText: `sans rapport ${STAMP}` })).toHaveCount(1);

		// Late parent: P arrives AFTER its reply D — they must fold together.
		await sendMail({
			from: "paul@e2e.local",
			to: EMAIL,
			subject: OTHER_SUBJECT,
			body: "corps message P parent",
			messageId: `P-${STAMP}@e2e.local`,
		});
		const adopted = await syncUntil(page, async () => {
			const rows = page.locator("li", { hasText: OTHER_SUBJECT });
			if ((await rows.count()) !== 1) return false;
			return (await rows.first().getByText("2", { exact: true }).count()) > 0;
		});
		expect(adopted, "late parent P should adopt orphan reply D").toBe(true);

		// The 3-message conversation opens with all three bodies.
		await page.locator("li", { hasText: SUBJECT }).first().click();
		await page.waitForURL(/\/threads\//);
		for (const body of ["corps message A", "corps message B", "corps message C"]) {
			await expect(
				page.getByText(body).filter({ visible: true }).first(),
			).toBeVisible();
		}
	});
});
