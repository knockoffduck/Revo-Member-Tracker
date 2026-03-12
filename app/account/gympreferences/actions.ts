"use server";
import { db } from "@/app/db/database";
import { revoGyms, user } from "@/app/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const gymPreferencesSchema = z.array(z.string().trim().min(1).max(120)).max(20);

export const setGymPreferences = async (formData: FormData) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const userId = session?.user?.id;
	if (!userId) {
		throw new Error("User not authenticated");
	}
	const rawData = Object.fromEntries(formData);
	const parsedGyms = JSON.parse(String(rawData.gyms ?? "[]"));
	const validationResult = gymPreferencesSchema.safeParse(parsedGyms);

	if (!validationResult.success) {
		throw new Error("Invalid gym preference payload");
	}

	const selectedGyms = validationResult.data;

	if (selectedGyms.length > 0) {
		const validGyms = await db
			.select({ name: revoGyms.name })
			.from(revoGyms)
			.where(eq(revoGyms.active, 1));

		const allowedGymNames = new Set(validGyms.map((gym) => gym.name));
		const allSelectionsAreValid = selectedGyms.every((gym) =>
			allowedGymNames.has(gym)
		);

		if (!allSelectionsAreValid) {
			throw new Error("Invalid gym selection");
		}
	}

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
