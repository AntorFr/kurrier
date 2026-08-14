import { getWorkspaceRedirectUrl, isSignedIn } from "@/lib/actions/auth";
import type { UserEntity } from "@db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await isSignedIn();

	if (user) {
		// Send signed-in users to their workspace (the bare
		// /dashboard/platform/overview path has no /w/<workspace> segment
		// and 404s).
		redirect(await getWorkspaceRedirectUrl(user as UserEntity));
	}

	return <>{children}</>;
}
