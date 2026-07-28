"use server";

import { createAdminPb } from "@/lib/server/pocketbase";
import { requireAdminSession } from "@/lib/authz";
import { gymSchema, type GymMutationResult } from "./schema";
import { z } from "zod";

export type { GymMutationResult };

async function assertAdmin(): Promise<boolean> {
	try {
		await requireAdminSession();
		return true;
	} catch {
		return false;
	}
}

const toPbGym = (data: z.infer<typeof gymSchema>) => ({
	name: data.name,
	state: data.state,
	area_size: data.areaSize,
	address: data.address,
	postcode: data.postcode,
	active: data.active === 1 || data.active === true,
	timezone: data.timezone,
	latitude: data.latitude ?? 0,
	longitude: data.longitude ?? 0,
	Squat_Racks: data.squatRacks,
	last_updated: new Date().toISOString(),
});

export const createGym = async (input: z.infer<typeof gymSchema>): Promise<GymMutationResult> => {
	if (!(await assertAdmin())) {
		return { success: false, message: "Unauthorized" };
	}
	const parsed = gymSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, message: "Invalid input", error: parsed.error.flatten() };
	}

	try {
		const pb = await createAdminPb();
		const record = await pb.collection("Revo_Gyms").create(toPbGym(parsed.data));
		return { success: true, message: "Gym created", data: { id: record.id } };
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
	const idParsed = z.string().min(1, "Invalid gym id").safeParse(id);
	if (!idParsed.success) {
		return { success: false, message: "Invalid gym id" };
	}
	const parsed = gymSchema.partial().safeParse(input);
	if (!parsed.success) {
		return { success: false, message: "Invalid input", error: parsed.error.flatten() };
	}

	const updates: Record<string, unknown> = {};
	if (parsed.data.name !== undefined) updates.name = parsed.data.name;
	if (parsed.data.state !== undefined) updates.state = parsed.data.state;
	if (parsed.data.areaSize !== undefined) updates.area_size = parsed.data.areaSize;
	if (parsed.data.address !== undefined) updates.address = parsed.data.address;
	if (parsed.data.postcode !== undefined) updates.postcode = parsed.data.postcode;
	if (parsed.data.active !== undefined) updates.active = parsed.data.active === 1 || parsed.data.active === true;
	if (parsed.data.timezone !== undefined) updates.timezone = parsed.data.timezone;
	if (parsed.data.latitude !== undefined) updates.latitude = parsed.data.latitude;
	if (parsed.data.longitude !== undefined) updates.longitude = parsed.data.longitude;
	if (parsed.data.squatRacks !== undefined) updates.Squat_Racks = parsed.data.squatRacks;
	updates.last_updated = new Date().toISOString();

	if (Object.keys(updates).length === 0) {
		return { success: false, message: "No fields to update" };
	}

	try {
		const pb = await createAdminPb();
		await pb.collection("Revo_Gyms").update(idParsed.data, updates);
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
	const idParsed = z.string().min(1, "Invalid gym id").safeParse(id);
	if (!idParsed.success) {
		return { success: false, message: "Invalid gym id" };
	}

	try {
		const pb = await createAdminPb();
		const dependents = await pb.collection("Revo_Gym_Count").getList(1, 1, {
			filter: pb.filter("gym_id={:gymId}", { gymId: idParsed.data }),
		});
		const depCount = dependents.totalItems;

		if (depCount > 0) {
			return {
				success: false,
				message: `Cannot delete: ${depCount} historical count record(s) reference this gym. Deactivate it instead.`,
			};
		}

		await pb.collection("Revo_Gyms").delete(idParsed.data);
		return { success: true, message: "Gym deleted" };
	} catch (err) {
		return {
			success: false,
			message: (err as Error)?.message || "Failed to delete gym",
		};
	}
};
