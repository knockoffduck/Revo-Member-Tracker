"use server";

import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema"; // Added revoGyms
import { auth } from "@/lib/auth";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { Gym } from "@/app/gyms/_types";
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
export const fetchGyms = async (
	showAllGyms: boolean,
	currentTime: string,
	sort: { key: string; direction: "asc" | "desc" } = {
		key: "percentage",
		direction: "asc",
	}
) => {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		const userId = session?.user?.id;

		// Determine OrderBy Clause
		let orderByClause;
		if (sort.key === "gymName") {
			orderByClause =
				sort.direction === "asc"
					? asc(revoGymCount.gymName)
					: desc(revoGymCount.gymName);
		} else if (sort.key === "percentage") {
			orderByClause =
				sort.direction === "asc"
					? asc(revoGymCount.percentage)
					: desc(revoGymCount.percentage);
		} else if (sort.key === "areaSize") {
			orderByClause =
				sort.direction === "asc"
					? asc(revoGyms.areaSize)
					: desc(revoGyms.areaSize);
		} else if (sort.key === "count") {
			orderByClause =
				sort.direction === "asc"
					? asc(revoGymCount.count)
					: desc(revoGymCount.count);
		} else if (sort.key === "rackAmount") {
			orderByClause =
				sort.direction === "asc"
					? asc(revoGyms.squatRacks)
					: desc(revoGyms.squatRacks);
		} else {
			// Fallback
			orderByClause = asc(revoGymCount.percentage);
		}

		// Determine Base Filter (Timestamp + AreaSize/RackAmount check if sorting by those)
		const baseConditions = [
			eq(revoGymCount.created, currentTime),
			eq(revoGyms.active, 1),
		];
		if (sort.key === "areaSize") {
			baseConditions.push(gte(revoGyms.areaSize, 1)); // Ensure valid area size
		}
		if (sort.key === "rackAmount") {
			baseConditions.push(gte(revoGyms.squatRacks, 1)); // Ensure valid rack count
		}

		// Base query to select gyms for the specific timestamp, ordered and filtered
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
				timezone: revoGyms.timezone,
				squatRacks: revoGyms.squatRacks,
			})
			.from(revoGymCount)
			.innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
			.where(and(...baseConditions))
			.orderBy(orderByClause);

		// Helper function to apply client-side sorting for perRack
		const applyPerRackSort = (data: Gym[]) => {
			if (sort.key === "perRack") {
				return data.sort((a, b) => {
					const ratioA = a.squatRacks > 0 ? a.count / a.squatRacks : Infinity;
					const ratioB = b.squatRacks > 0 ? b.count / b.squatRacks : Infinity;
					return sort.direction === "asc" ? ratioA - ratioB : ratioB - ratioA;
				});
			}
			return data;
		};

		// If user is not logged in OR wants to see all gyms, execute the base query
		if (!userId || showAllGyms) {
			const data = await baseQuery;
			return applyPerRackSort(data);
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
			const data = await baseQuery;
			return applyPerRackSort(data);
		}

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
				timezone: revoGyms.timezone,
				squatRacks: revoGyms.squatRacks,
			})
			.from(revoGymCount)
			.innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
			.where(
				and(
					...baseConditions,
					inArray(revoGymCount.gymName, gymPreferences as string[])
				)
			)
			.orderBy(orderByClause);

		return applyPerRackSort(data);
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

/**
 * Server Action to get a user's gym preferences list.
 *
 * @param userId - The ID of the user to check.
 * @returns A Promise resolving to an array of gym names.
 */
export const getUserGymPreferences = async (
	userId: string | undefined
): Promise<string[]> => {
	if (!userId) {
		return [];
	}

	try {
		const result = await db
			.select({ gymPreferences: user.gymPreferences })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const gymPreferences = result[0]?.gymPreferences;
		if (Array.isArray(gymPreferences)) {
			return gymPreferences as string[];
		}
		return [];
	} catch (error) {
		console.error(`Error fetching gym preferences for user ${userId}:`, error);
		return [];
	}
};
