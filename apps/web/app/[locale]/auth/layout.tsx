import { isSignedIn, resolveWorkspaceRedirectUrl } from "@/lib/actions/auth";
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
		// and 404s). The read-only resolver is deliberate: layouts render
		// as server components and must not write cookies.
		redirect(await resolveWorkspaceRedirectUrl(user));
	}

	return <>{children}</>;
}
