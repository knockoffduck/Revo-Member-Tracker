"use server";
import { db } from "@/app/db/database";
import { revoGyms, user } from "@/app/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const setGymPreferences = async (formData: FormData) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const userId = session?.user?.id;
	if (!userId) {
		throw new Error("User not authenticated");
	}
	const rawData = Object.fromEntries(formData);
	const selectedGyms = JSON.parse(rawData.gyms as string);
	if (selectedGyms.length === 0) {
		await db
			.update(user)
			.set({ gymPreferences: null })
			.where(eq(user.id, userId));
		return;
	}
	await db
		.update(user)
		.set({ gymPreferences: selectedGyms })
		.where(eq(user.id, userId));
	return;
};
