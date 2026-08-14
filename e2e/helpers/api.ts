import {
	ADMIN_KEY,
	IMAP_HOST,
	IMAP_PORT,
	SMTP_HOST,
	SMTP_PORT,
	WORKER_URL,
} from "./env";

export type ApiResult = { status: number; json: any };

export async function adminApi(
	path: string,
	method = "GET",
	body?: unknown,
	key: string | null = ADMIN_KEY,
): Promise<ApiResult> {
	const res = await fetch(`${WORKER_URL}/api/kurrier${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...(key ? { Authorization: `Bearer ${key}` } : {}),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const json = await res.json().catch(() => null);
	return { status: res.status, json };
}

/**
 * Provisions a ready-to-use mailbox user through the admin API — the same
 * path production automation uses: user, SMTP/IMAP account (greenmail),
 * then the email identity (mailbox discovery + backfill + IDLE).
 */
export async function seedMailUser(email: string) {
	const user = await adminApi("/users", "POST", { email });
	if (user.status !== 200) {
		throw new Error(`seed user failed: ${user.status}`);
	}

	const account = await adminApi("/smtp-accounts", "POST", {
		userEmail: email,
		label: "E2E greenmail",
		smtp: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: false,
			username: email,
			password: "e2e-password",
		},
		imap: {
			host: IMAP_HOST,
			port: IMAP_PORT,
			secure: false,
			username: email,
			password: "e2e-password",
		},
	});
	if (account.status !== 200) {
		throw new Error(`seed smtp account failed: ${account.status}`);
	}

	const identity = await adminApi("/identities", "POST", {
		userEmail: email,
		value: email,
		displayName: email.split("@")[0],
		smtpAccountId: account.json.data.id,
		sharedWithWorkspace: true,
	});

	return {
		user: user.json.data,
		smtpAccountId: account.json.data.id as string,
		identity: identity.json?.data ?? null,
		identityStatus: identity.status,
		backfill: identity.json?.data?.backfill as string | undefined,
	};
}
