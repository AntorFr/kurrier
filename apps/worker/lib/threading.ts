import { db, mailboxThreads, messages, threads } from "@db";
import { upsertMailboxThreadItem } from "@common";
import { eq, inArray, sql } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Subject with reply/forward prefixes stripped (Re:, Fwd:, localized
 * variants, chained), lowercased. Returns null for empty or too-short
 * results, which must never participate in subject-based grouping.
 */
export function normalizeSubject(subject?: string | null): string | null {
	if (!subject) return null;
	const stripped = subject
		.replace(/^\s*(((re|fwd?|fw|aw|tr|sv|vs|rv|res)(\[\d+\])?)\s*:\s*)+/i, "")
		.trim()
		.toLowerCase();
	return stripped.length >= 3 ? stripped : null;
}

/**
 * Folds the loser threads into the winner: rewires messages, rebuilds the
 * per-mailbox rollups, refreshes the winner's aggregates and deletes the
 * losers. Used when a message proves that separate threads are actually
 * one conversation (e.g. a parent arriving after its replies).
 */
export async function mergeThreads(
	tx: Tx,
	winnerId: string,
	loserIds: string[],
) {
	if (!loserIds.length) return;

	const affected = await tx
		.select({ id: messages.id, mailboxId: messages.mailboxId })
		.from(messages)
		.where(inArray(messages.threadId, loserIds));

	await tx
		.update(messages)
		.set({ threadId: winnerId })
		.where(inArray(messages.threadId, loserIds));

	await tx
		.delete(mailboxThreads)
		.where(inArray(mailboxThreads.threadId, loserIds));

	// One rollup rebuild per affected mailbox is enough — the helper
	// recomputes the whole (thread × mailbox) row from messages.
	const oneMessagePerMailbox = new Map<string, string>();
	for (const m of affected) {
		if (m.mailboxId) oneMessagePerMailbox.set(m.mailboxId, m.id);
	}
	for (const messageId of oneMessagePerMailbox.values()) {
		await upsertMailboxThreadItem(messageId, tx as any);
	}

	await tx
		.update(threads)
		.set({
			messageCount: sql`(SELECT count(*) FROM ${messages} WHERE ${messages.threadId} = ${winnerId})`,
			lastMessageDate: sql`(SELECT max(coalesce(${messages.date}, ${messages.createdAt})) FROM ${messages} WHERE ${messages.threadId} = ${winnerId})`,
			updatedAt: new Date(),
		})
		.where(eq(threads.id, winnerId));

	await tx.delete(threads).where(inArray(threads.id, loserIds));
}
