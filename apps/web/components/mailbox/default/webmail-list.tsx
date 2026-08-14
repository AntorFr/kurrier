"use client";
import * as React from "react";
import { PublicConfig } from "@schema";
import {
	FetchIdentityMailboxListResult, FetchMailboxResult,
	FetchMailboxThreadsResult,
} from "@/lib/actions/mailbox";
import {
	FetchLabelsResult,
	FetchMailboxThreadLabelsResult,
} from "@/lib/actions/labels";
import type { MailboxEntity } from "@db";
import MailListHeader from "@/components/mailbox/default/mail-list-header";
import WebmailListItem from "@/components/mailbox/default/webmail-list-item";
import { DynamicContextProvider } from "@/hooks/use-dynamic-context";
import { useMediaQuery } from "@mantine/hooks";
import WebmailListItemMobile from "@/components/mailbox/default/webmail-list-item-mobile";
import { usePathname } from "next/navigation";
import {use} from "react";

type WebListProps = {
	mailboxThreadPromise: Promise<{ mailboxThreads: FetchMailboxThreadsResult, labelsByThreadId: FetchMailboxThreadLabelsResult }>;
	publicConfig: PublicConfig;
	identityPublicId: string;
	identityMailboxesPromise: Promise<FetchIdentityMailboxListResult>;
	fetchMailboxPromise: Promise<FetchMailboxResult>;
	globalLabelsPromise: Promise<FetchLabelsResult>;
	workspacePublicId?: string;
};

export default function WebmailList({
	mailboxThreadPromise,
	identityPublicId,
	publicConfig,
	identityMailboxesPromise,
	globalLabelsPromise,
	workspacePublicId,
	fetchMailboxPromise
}: WebListProps) {
	const {labelsByThreadId, mailboxThreads} = use(mailboxThreadPromise)
	const globalLabels = use(globalLabelsPromise)
	const fetchedMailbox = use(fetchMailboxPromise)
	const mailboxSync = fetchedMailbox.mailboxSync
	const activeMailbox = fetchedMailbox.activeMailbox as MailboxEntity
	const identityMailboxes = use(identityMailboxesPromise)
	const isMobile = useMediaQuery("(max-width: 768px)");
	// Gate on the URL, not useParams(): a retained parallel-route slot keeps
	// its [threadId] param alive after navigating back to the mailbox, which
	// left the list hidden. The pathname always reflects the real location.
	const pathname = usePathname();
	const threadOpen = pathname?.includes("/threads/");

	// Archive action only makes sense when the identity has an archive folder
	const hasArchive = identityMailboxes.some(
		(row) =>
			row.identity?.id === activeMailbox?.identityId &&
			row.mailboxes?.some((m: MailboxEntity) => m.kind === "archive"),
	);

	return (
		<div className={threadOpen ? "hidden" : ""}>
			<DynamicContextProvider
				initialState={{
					selectedThreadIds: new Set(),
					activeMailbox,
					identityPublicId,
				}}
			>
				{mailboxThreads.length === 0 ? (
					<div className="p-4 text-center text-base text-muted-foreground">
						No messages in{" "}
						<span className={"lowercase"}>{activeMailbox.name}</span>
					</div>
				) : (
					<div className="rounded-xl border bg-background/50 z-[50]">
						<MailListHeader
							mailboxThreads={mailboxThreads}
							mailboxSync={mailboxSync ?? undefined}
							publicConfig={publicConfig}
							identityMailboxes={identityMailboxes}
							activeMailbox={activeMailbox}
						/>

						<ul role="list" className={`divide-y rounded-4xl`}>
							{mailboxThreads.map((mailboxThreadItem) =>
								isMobile ? (
									<WebmailListItemMobile
										key={
											mailboxThreadItem.threadId + mailboxThreadItem.mailboxId
										}
										mailboxThreadItem={mailboxThreadItem}
										activeMailbox={activeMailbox}
										identityPublicId={identityPublicId}
										mailboxSync={mailboxSync ?? undefined}
										labelsByThreadId={labelsByThreadId}
										hasArchive={hasArchive}
									/>
								) : (
									<WebmailListItem
										key={
											mailboxThreadItem.threadId + mailboxThreadItem.mailboxId
										}
										mailboxThreadItem={mailboxThreadItem}
										workspacePublicId={workspacePublicId}
										activeMailbox={activeMailbox}
										identityPublicId={identityPublicId}
										mailboxSync={mailboxSync ?? undefined}
										globalLabels={globalLabels}
										labelsByThreadId={labelsByThreadId}
										hasArchive={hasArchive}
									/>
								),
							)}
						</ul>
					</div>
				)}
			</DynamicContextProvider>
		</div>
	);
}
