import net from "node:net";
import { IMAP_HOST, IMAP_PORT, SMTP_HOST, SMTP_PORT } from "./env";

function talk(
	socket: net.Socket,
	steps: { send?: string; expect: RegExp }[],
): Promise<void> {
	return new Promise((resolve, reject) => {
		let buffer = "";
		let index = 0;

		const timer = setTimeout(() => {
			socket.destroy();
			reject(new Error(`protocol timeout at step ${index}: ${buffer.slice(-200)}`));
		}, 15_000);

		const advance = () => {
			while (index < steps.length && steps[index].expect.test(buffer)) {
				buffer = "";
				index += 1;
				if (index === steps.length) {
					clearTimeout(timer);
					socket.end();
					resolve();
					return;
				}
				const next = steps[index];
				if (next.send !== undefined) socket.write(next.send);
			}
		};

		socket.on("data", (chunk) => {
			buffer += chunk.toString();
			advance();
		});
		socket.on("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
		if (steps[0]?.send !== undefined) socket.write(steps[0].send);
	});
}

/** Delivers a message to greenmail over plain SMTP. */
export async function sendMail(opts: {
	from: string;
	to: string;
	subject: string;
	body: string;
	inReplyTo?: string;
	messageId?: string;
}) {
	const socket = net.connect(SMTP_PORT, SMTP_HOST);
	const data = [
		`From: ${opts.from}`,
		`To: ${opts.to}`,
		`Subject: ${opts.subject}`,
		`Message-ID: <${opts.messageId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.local`}>`,
		...(opts.inReplyTo ? [`In-Reply-To: <${opts.inReplyTo}>`] : []),
		`Date: ${new Date().toUTCString()}`,
		"",
		opts.body,
		".",
		"",
	].join("\r\n");

	await talk(socket, [
		{ expect: /^220 / },
		{ send: "HELO e2e.local\r\n", expect: /^250 /m },
		{ send: `MAIL FROM:<${opts.from}>\r\n`, expect: /250 / },
		{ send: `RCPT TO:<${opts.to}>\r\n`, expect: /250 / },
		{ send: "DATA\r\n", expect: /354 / },
		{ send: data, expect: /250 / },
		{ send: "QUIT\r\n", expect: /221 / },
	]);
}

/**
 * Creates an IMAP folder on greenmail (auth is disabled there, any
 * credentials work). Used to give test mailboxes an Archive folder that
 * kurrier's discovery then maps to the archive kind.
 */
export async function createImapFolder(user: string, folder: string) {
	const socket = net.connect(IMAP_PORT, IMAP_HOST);
	await talk(socket, [
		{ expect: /\* OK/ },
		{ send: `a1 LOGIN "${user}" "e2e-password"\r\n`, expect: /a1 OK/ },
		{ send: `a2 CREATE "${folder}"\r\n`, expect: /a2 (OK|NO)/ },
		{ send: "a3 LOGOUT\r\n", expect: /a3 OK/ },
	]);
}

/**
 * Gives a greenmail user the folder layout of a real mail host — parts of
 * the app assume the standard folders exist (drafts, sent, ...).
 */
export async function provisionStandardFolders(user: string) {
	for (const folder of ["Sent", "Drafts", "Trash", "Junk", "Archive"]) {
		await createImapFolder(user, folder);
	}
}
