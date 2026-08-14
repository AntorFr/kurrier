import { isSignedIn, resolveWorkspaceRedirectUrl } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await isSignedIn();

	if (user) {
		redirect(await resolveWorkspaceRedirectUrl(user));
	}

	redirect("/auth/login");
}
