"use server";

import { db } from "@/app/db/database";
import { revoGymCount, revoGyms } from "@/app/db/schema";
import { requireAdminSession } from "@/lib/authz";
import { count, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export type GymMutationResult = {
	success: boolean;
	message: string;
	data?: { id?: string };
	error?: unknown;
};

async function assertAdmin(): Promise<boolean> {
	try {
		await requireAdminSession();
		return true;
	} catch {
		return false;
	}
}

export const gymSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
	state: z.string().trim().min(1, "State is required").max(50),
	areaSize: z
		.number()
		.int("Area size must be a whole number")
		.min(0, "Area size cannot be negative")
		.max(1_000_000),
	address: z.string().trim().min(1, "Address is required").max(500),
	postcode: z.number().int("Postcode must be a whole number").min(0, "Postcode cannot be negative").max(99999),
	active: z.union([z.literal(0), z.literal(1)], { message: "Active must be 0 or 1" }),
	timezone: z.string().trim().min(1, "Timezone is required").max(50).default("Australia/Perth"),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	squatRacks: z.number().int("Squat racks must be a whole number").min(0, "Squat racks cannot be negative").max(255).default(0),
});

export const createGym = async (input: z.infer<typeof gymSchema>): Promise<GymMutationResult> => {
	if (!(await assertAdmin())) {
		return { success: false, message: "Unauthorized" };
	}
	const parsed = gymSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, message: "Invalid input", error: parsed.error.flatten() };
	}

	const id = randomUUID();

	try {
		await db.insert(revoGyms).values({
			id,
			name: parsed.data.name,
			state: parsed.data.state,
			areaSize: parsed.data.areaSize,
			address: parsed.data.address,
			postcode: parsed.data.postcode,
			active: parsed.data.active,
			timezone: parsed.data.timezone,
			squatRacks: parsed.data.squatRacks,
			latitude: parsed.data.latitude ?? null,
			longitude: parsed.data.longitude ?? null,
			lastUpdated: sql`NOW()`,
		});
		return { success: true, message: "Gym created", data: { id } };
	} catch (err) {
		return {
			success: false,
			message: (err as Error)?.message || "Failed to create gym",
		};
	}
};

export const updateGym = async (
	id: string,
	input: Partial<z.infer<typeof gymSchema>>,
): Promise<GymMutationResult> => {
	if (!(await assertAdmin())) {
		return { success: false, message: "Unauthorized" };
	}
	const idParsed = z.string().length(36, "Invalid gym id").safeParse(id);
	if (!idParsed.success) {
		return { success: false, message: "Invalid gym id" };
	}
	const parsed = gymSchema.partial().safeParse(input);
	if (!parsed.success) {
		return { success: false, message: "Invalid input", error: parsed.error.flatten() };
	}

	const updates = Object.fromEntries(
		Object.entries(parsed.data).filter(([, v]) => v !== undefined),
	) as Partial<typeof revoGyms.$inferInsert>;

	if (Object.keys(updates).length === 0) {
		return { success: false, message: "No fields to update" };
	}

	try {
		await db
			.update(revoGyms)
			.set({ ...updates, lastUpdated: sql`NOW()` })
			.where(eq(revoGyms.id, idParsed.data));
		return { success: true, message: "Gym updated" };
	} catch (err) {
		return {
			success: false,
			message: (err as Error)?.message || "Failed to update gym",
		};
	}
};

export const deleteGym = async (id: string): Promise<GymMutationResult> => {
	if (!(await assertAdmin())) {
		return { success: false, message: "Unauthorized" };
	}
	const idParsed = z.string().length(36, "Invalid gym id").safeParse(id);
	if (!idParsed.success) {
		return { success: false, message: "Invalid gym id" };
	}

	try {
		const dependents = await db
			.select({ c: count() })
			.from(revoGymCount)
			.where(eq(revoGymCount.gymId, idParsed.data));
		const depCount = Number(dependents[0]?.c ?? 0);

		if (depCount > 0) {
			return {
				success: false,
				message: `Cannot delete: ${depCount} historical count record(s) reference this gym. Deactivate it instead.`,
			};
		}

		await db.delete(revoGyms).where(eq(revoGyms.id, idParsed.data));
		return { success: true, message: "Gym deleted" };
	} catch (err) {
		return {
			success: false,
			message: (err as Error)?.message || "Failed to delete gym",
		};
	}
};
