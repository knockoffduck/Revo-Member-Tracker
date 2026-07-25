"use server";

import { createPublicPb } from "@/lib/server/pocketbase";
import { getCurrentUser, getGymPreferencesForUser } from "@/lib/current-user";
import { Gym } from "@/app/gyms/_types";

type PbRecord = Record<string, unknown>;

const mapGym = (record: PbRecord, meta?: PbRecord | null): Gym => ({
	id: String(record.id),
	created: String(record.created),
	count: Number(record.count ?? 0),
	ratio: Number(record.ratio ?? 0),
	gymName: String(record.gym_name ?? record.name ?? ""),
	percentage: Number(record.percentage ?? 0),
	gymId: String(record.gym_id ?? record.id),
	areaSize: Number((meta as PbRecord)?.area_size ?? 0),
	state: String((meta as PbRecord)?.state ?? ""),
	timezone: String((meta as PbRecord)?.timezone ?? "Australia/Perth"),
	squatRacks: Number((meta as PbRecord)?.Squat_Racks ?? 0),
});

/**
 * Server Action to fetch gym occupancy data based on user preferences and a toggle.
 */
export const fetchGyms = async (
	showAllGyms: boolean,
	currentTime: string,
	sort: { key: string; direction: "asc" | "desc" } = {
		key: "percentage",
		direction: "asc",
	}
) => {
	try {
		const user = await getCurrentUser();
		const userId = user?.id;

		const pb = createPublicPb();

		const minutePrefix = currentTime.slice(0, 16);
		const records = await pb.collection("Revo_Gym_Count").getFullList<PbRecord>({
			filter: `created>='${minutePrefix}:00' && created<='${minutePrefix}:59'`,
			batch: 200,
		});

		const gymIds = [...new Set(records.map((r) => r.gym_id).filter(Boolean))];
		const gymMetaMap = new Map<string, PbRecord>();
		if (gymIds.length > 0) {
			const metaFilterParts = [gymIds.map((id) => `id='${id}'`).join(" || "), "active=true"];
			const metaRecords = await pb.collection("Revo_Gyms").getFullList<PbRecord>({
				filter: metaFilterParts.join(" && "),
				batch: 200,
			});
			for (const record of metaRecords) {
				gymMetaMap.set(String(record.id), record);
			}
		}

		let data: Gym[] = records
			.filter((record) => gymMetaMap.has(String(record.gym_id)))
			.map((record) => mapGym(record, gymMetaMap.get(String(record.gym_id))!));

		if (userId && !showAllGyms) {
			const preferences = user?.gymPreferences ?? [];
			if (preferences.length > 0) {
				data = data.filter((g) => preferences.includes(g.gymName));
			}
		}

		if (sort.key === "areaSize") {
			data = data.filter((g) => g.areaSize >= 1);
		}
		if (sort.key === "rackAmount") {
			data = data.filter((g) => g.squatRacks >= 1);
		}

		if (sort.key === "gymName") {
			data.sort((a, b) =>
				sort.direction === "asc" ? a.gymName.localeCompare(b.gymName) : b.gymName.localeCompare(a.gymName)
			);
		} else if (sort.key === "percentage") {
			data.sort((a, b) => (sort.direction === "asc" ? a.percentage - b.percentage : b.percentage - a.percentage));
		} else if (sort.key === "areaSize") {
			data.sort((a, b) => (sort.direction === "asc" ? a.areaSize - b.areaSize : b.areaSize - a.areaSize));
		} else if (sort.key === "count") {
			data.sort((a, b) => (sort.direction === "asc" ? a.count - b.count : b.count - a.count));
		} else if (sort.key === "rackAmount") {
			data.sort((a, b) => (sort.direction === "asc" ? a.squatRacks - b.squatRacks : b.squatRacks - a.squatRacks));
		} else {
			data.sort((a, b) => (sort.direction === "asc" ? a.percentage - b.percentage : b.percentage - a.percentage));
		}

		if (sort.key === "perRack") {
			data.sort((a, b) => {
				const ratioA = a.squatRacks > 0 ? a.count / a.squatRacks : Infinity;
				const ratioB = b.squatRacks > 0 ? b.count / b.squatRacks : Infinity;
				return sort.direction === "asc" ? ratioA - ratioB : ratioB - ratioA;
			});
		}

		return data;
	} catch (error) {
		console.error("Error in fetchGyms server action:", error);
		throw new Error("Failed to fetch gym data.");
	}
};

export const userHasGymPreferences = async (userId: string | undefined): Promise<boolean> => {
	if (!userId) return false;
	const preferences = await getGymPreferencesForUser(userId);
	return preferences.length > 0;
};

export const getUserGymPreferences = async (userId: string | undefined): Promise<string[]> => {
	if (!userId) return [];
	return await getGymPreferencesForUser(userId);
};
