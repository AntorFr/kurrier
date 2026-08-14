import { getWorkspaceRedirectUrl, isSignedIn } from "@/lib/actions/auth";
import type { UserEntity } from "@db";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await isSignedIn();

	if (user) {
		redirect(await getWorkspaceRedirectUrl(user as UserEntity));
	}

	redirect("/auth/login");
}
