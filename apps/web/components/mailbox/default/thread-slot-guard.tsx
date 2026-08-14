"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Parallel-route slots keep their previously matched content on soft
// navigation (default.tsx only applies to hard loads), so an open thread
// would stay on screen after clicking back to a mailbox in the sidebar.
// The retained slot stays mounted and its client hooks keep updating, so
// gate its content on the URL actually containing a thread.
export default function ThreadSlotGuard({
	children,
}: {
	children: ReactNode;
}) {
	const pathname = usePathname();

	if (!pathname?.includes("/threads/")) return null;

	return <>{children}</>;
}
