import { supabaseClient } from "./supabaseClient";
import { Gym } from "@/app/_types";

export const revalidate = 0;

export const getGyms = async (gyms?: string[]) => {
	const supabase = supabaseClient();
	if (!supabase) throw new Error("Cannot access Supabase");

	try {
		// Step 1: Get the latest `created_at` timestamp
		const { data: latestEntry, error: latestError } = await supabase
			.from("Revo Member Stats")
			.select("created_at")
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (latestError) throw latestError;
		if (!latestEntry) throw new Error("No entries found in the database");

		const latestCreatedAt = latestEntry.created_at;

		// Step 2: Fetch all entries with the same latest `created_at` timestamp
		const query = supabase
			.from("Revo Member Stats")
			.select("name, size, member_count, member_ratio, percentage, created_at")
			.eq("created_at", latestCreatedAt)
			.order("percentage", { ascending: false });

		// Apply gym name filtering if `gyms` is provided
		if (gyms && gyms.length > 0) {
			query.in("name", gyms);
		}

		const { data: filteredEntries, error: filteredError } = await query;

		if (filteredError) throw filteredError;

		const result: { timestamp: string; data: Gym[] } = {
			timestamp: latestCreatedAt,
			data: filteredEntries || [],
		};

		return result;
	} catch (error) {
		console.error("Error fetching gym data:", error);
		throw error;
	}
};
