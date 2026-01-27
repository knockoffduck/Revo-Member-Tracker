"use server";

import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema"; // Added revoGyms
import { auth } from "@/lib/auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
// Removed unused NextResponse

/**
 * Server Action to fetch gym occupancy data based on user preferences and a toggle.
 * Called by the GymList component when the "Show All" switch changes.
 *
 * @param showAllGyms - Boolean indicating whether to fetch all gyms or only preferred ones.
 * @param currentTime - The timestamp string of the latest data set to fetch.
 * @returns A Promise resolving to an array of Gym objects.
 * @throws Will throw an error if database fetching fails.
 */
export const fetchGyms = async (showAllGyms: boolean, currentTime: string) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		const userId = session?.user?.id;

		// Base query to select gyms for the specific timestamp, ordered by percentage
		const baseQuery = db
			.select({
				id: revoGymCount.id,
				created: revoGymCount.created,
				count: revoGymCount.count,
				ratio: revoGymCount.ratio,
				gymName: revoGymCount.gymName,
				percentage: revoGymCount.percentage,
				gymId: revoGymCount.gymId,
				areaSize: revoGyms.areaSize,
				state: revoGyms.state,
			})
			.from(revoGymCount)
			.innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
			.where(eq(revoGymCount.created, currentTime))
			.orderBy(desc(revoGymCount.percentage));

		// If user is not logged in OR wants to see all gyms, execute the base query
		if (!userId || showAllGyms) {
			return await baseQuery;
		}

		// --- User is logged in and wants to see preferred gyms ---

		// Fetch user's preferences
		const userPreferencesResult = await db
			.select({ gymPreferences: user.gymPreferences })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		// Check if preferences exist and are valid
		const gymPreferences = userPreferencesResult[0]?.gymPreferences;
		if (
			!gymPreferences ||
			!Array.isArray(gymPreferences) ||
			gymPreferences.length === 0
		) {
			// If no preferences found, return all gyms (same as showAllGyms = true)
			console.warn(
				`User ${userId} has no valid gym preferences set. Fetching all gyms.`
			);
			return await baseQuery;
		}

		// Fetch gyms filtered by user preferences
		// Fetch gyms filtered by user preferences
		const data = await db
			.select({
				id: revoGymCount.id,
				created: revoGymCount.created,
				count: revoGymCount.count,
				ratio: revoGymCount.ratio,
				gymName: revoGymCount.gymName,
				percentage: revoGymCount.percentage,
				gymId: revoGymCount.gymId,
				areaSize: revoGyms.areaSize,
				state: revoGyms.state,
			})
			.from(revoGymCount)
			.innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
			.where(
				and(
					eq(revoGymCount.created, currentTime),
					inArray(revoGymCount.gymName, gymPreferences as string[]) // Safe cast after Array.isArray check
				)
			)
			.orderBy(desc(revoGymCount.percentage));

		return data;
	} catch (error) {
		console.error("Error in fetchGyms server action:", error);
		// Re-throw the error to be handled by the calling client component
		throw new Error("Failed to fetch gym data.");
	}
};

/**
 * Server Action to check if a user has set gym preferences.
 *
 * @param userId - The ID of the user to check.
 * @returns A Promise resolving to true if the user has preferences, false otherwise.
 */
export const userHasGymPreferences = async (
	userId: string | undefined
): Promise<boolean> => {
	// If no userId is provided, they cannot have preferences
	if (!userId) {
		return false;
	}

	try {
		// Fetch the preferences field for the user
		const result = await db
			.select({ gymPreferences: user.gymPreferences })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		// Check if the query returned a user and if preferences are set and not empty
		const gymPreferences = result[0]?.gymPreferences;
		// Check if it's a non-empty array
		return Array.isArray(gymPreferences) && gymPreferences.length > 0;
	} catch (error) {
		console.error(`Error checking gym preferences for user ${userId}:`, error);
		// In case of error, assume no preferences are set or accessible
		return false;
	}
};
