import { supabaseClient } from "./supabaseClient";
import { Gym } from "@/app/_types";

export const revalidate = 0;

export const getGyms = async () => {
	const supabase = supabaseClient();
	if (!supabase) throw new Error("Cannot access supabase");
	try {
		// Step 1: Get the latest `created_at` timestamp
		const { data: latestEntry, error: latestError } = await supabase
			.from("Revo Member Stats")
			.select("created_at")
			.order("created_at", { ascending: false })
			.limit(1)
			.single(); // Fetch the single latest entry

		if (latestError) throw latestError;
		if (!latestEntry) throw new Error("No entries found in the database");

		const latestCreatedAt = latestEntry.created_at;

		// Step 2: Fetch all entries with the same latest `created_at` timestamp
		const { data: filteredEntries, error: filteredError } = await supabase
			.from("Revo Member Stats")
			.select("name, size, member_count, member_ratio, percentage, created_at")
			.eq("created_at", latestCreatedAt) // Filter all entries with this timestamp
			.order("percentage", { ascending: false }); // Order by percentage descending

		if (filteredError) throw filteredError;

		const result: { timestamp: string; data: Gym[] } = {
			timestamp: latestCreatedAt,
			data: filteredEntries, // Contains all entries with the same latest `created_at`
		};

		return result;
	} catch (error) {
		console.error("Error fetching entries:", error);
		throw error;
	}
};
