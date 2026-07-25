import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/app/db/database";
import { user } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	isAdmin: boolean;
	gymPreferences: string[];
};

/**
 * Returns the current Better Auth session (or null when signed out).
 */
export async function getSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

function normalizePreferences(value: unknown): string[] {
	return Array.isArray(value) ? (value as unknown[]).filter((v): v is string => typeof v === "string") : [];
}

/**
 * Reads a user's gym preferences directly from the MySQL `user` table.
 */
export async function getGymPreferencesForUser(userId: string): Promise<string[]> {
	const rows = await db
		.select({ gymPreferences: user.gymPreferences })
		.from(user)
		.where(eq(user.id, userId));
	return normalizePreferences(rows[0]?.gymPreferences);
}

/**
 * Drop-in replacement for the old PocketBase `getCurrentUser()`, backed by
 * Better Auth (session) + MySQL (gym preferences) so user accounts, logins and
 * passwords remain in MySQL while app data lives in PocketBase.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
	const session = await getSession();
	const sessionUser = session?.user;
	if (!sessionUser) return null;

	const gymPreferences = await getGymPreferencesForUser(sessionUser.id);

	return {
		id: sessionUser.id,
		email: sessionUser.email,
		name: sessionUser.name ?? "",
		isAdmin: Boolean((sessionUser as { isAdmin?: boolean }).isAdmin),
		gymPreferences,
	};
}
