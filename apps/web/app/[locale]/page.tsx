import { isSignedIn, resolveWorkspaceRedirectUrl } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

// The locale proxy rewrites / to /<locale>/, which had no page and 404ed —
// deployments worked around it with a reverse-proxy redirect rule.
export default async function LocaleHome() {
	const user = await isSignedIn();

	if (user) {
		redirect(await resolveWorkspaceRedirectUrl(user));
	}

	redirect("/auth/login");
}
