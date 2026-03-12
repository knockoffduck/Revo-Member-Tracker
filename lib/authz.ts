import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSessionOrThrow() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	return session;
}

export async function requireAdminSession() {
	const session = await getSessionOrThrow();

	if (!(session.user as { isAdmin?: boolean }).isAdmin) {
		throw new Error("Forbidden");
	}

	return session;
}
