"use server";
import { createAdminPb } from "@/lib/server/pocketbase";
import { getSessionOrThrow } from "@/lib/authz";
import { db } from "@/app/db/database";
import { user } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const gymPreferencesSchema = z.array(z.string().trim().min(1).max(120)).max(20);

export const setGymPreferences = async (formData: FormData) => {
	const session = await getSessionOrThrow();
	const userId = session.user.id;
	const rawData = Object.fromEntries(formData);
	const parsedGyms = JSON.parse(String(rawData.gyms ?? "[]"));
	const validationResult = gymPreferencesSchema.safeParse(parsedGyms);

	if (!validationResult.success) {
		throw new Error("Invalid gym preference payload");
	}

	const selectedGyms = validationResult.data;

	if (selectedGyms.length > 0) {
		const pb = await createAdminPb();
		const validGyms = await pb.collection("Revo_Gyms").getFullList({
			filter: "active=true",
			batch: 200,
		});

		const allowedGymNames = new Set(validGyms.map((gym) => gym.name));
		const allSelectionsAreValid = selectedGyms.every((gym) =>
			allowedGymNames.has(gym)
		);

		if (!allSelectionsAreValid) {
			throw new Error("Invalid gym selection");
		}
	}

	await db
		.update(user)
		.set({ gymPreferences: selectedGyms.length === 0 ? null : selectedGyms })
		.where(eq(user.id, userId));
};
