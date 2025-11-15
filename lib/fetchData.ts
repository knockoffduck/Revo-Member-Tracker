import { Gym, GymResponse } from "@/app/_types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@/app/db/database";
import { revoGymCount, user } from "@/app/db/schema";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "./auth";
import { headers } from "next/headers";

// Extend dayjs with necessary plugins for timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);

// Disable caching for Next.js fetch requests made by functions in this file
// Ensures fresh data is always fetched.
export const revalidate = 0;

/**
 * Fetches the latest gym occupancy data.
 * Optionally filters by user preferences if a session exists and preferences are set.
 * @param gyms - Optional array of gym names (currently unused in the function logic but kept for potential future use).
 * @returns A Promise resolving to a GymResponse object containing the timestamp of the latest data and the gym data itself.
 */
export const getGyms = async (gyms?: string[]) => {
    try {
        // Find the timestamp of the most recent entry in the database
        const latestTimeResult = await db
            .select({ created: revoGymCount.created })
            .from(revoGymCount)
            .orderBy(desc(revoGymCount.created))
            .limit(1);

        // Ensure we found a timestamp
        if (!latestTimeResult || latestTimeResult.length === 0) {
            throw new Error("No entries found in the database");
        }
        const latestTimestamp = latestTimeResult[0].created;

        // Attempt to get the current user session
        const session = await auth.api.getSession({
            headers: await headers(), // Pass headers for server-side session retrieval
        });
        const userId = session?.user?.id;

        let latestData: Gym[] = [];

        // If no user is logged in, fetch all gyms for the latest timestamp
        if (!userId) {
            latestData = await db
                .select()
                .from(revoGymCount)
                .where(eq(revoGymCount.created, latestTimestamp))
                .orderBy(asc(revoGymCount.percentage)); // Order by occupancy percentage
        } else {
            // If a user is logged in, fetch their gym preferences
            const userPreferencesResult = await db
                .select({ gymPreferences: user.gymPreferences })
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            const gymPreferences = userPreferencesResult[0]?.gymPreferences;

            // If user has no preferences set, fetch all gyms (same as anonymous user)
            if (
                !gymPreferences ||
                !Array.isArray(gymPreferences) ||
                gymPreferences.length === 0
            ) {
                latestData = await db
                    .select()
                    .from(revoGymCount)
                    .where(eq(revoGymCount.created, latestTimestamp))
                    .orderBy(asc(revoGymCount.percentage));
            } else {
                // If user has preferences, fetch only the preferred gyms for the latest timestamp
                latestData = await db
                    .select()
                    .from(revoGymCount)
                    .where(
                        and(
                            eq(revoGymCount.created, latestTimestamp),
                            // Filter by gyms present in the user's preferences array
                            inArray(
                                revoGymCount.gymName,
                                gymPreferences as string[],
                            ),
                        ),
                    )
                    .orderBy(asc(revoGymCount.percentage));
            }
        }

        // Structure the response
        const result: GymResponse = {
            timestamp: latestTimestamp,
            data: latestData,
        };
        return result;
    } catch (error) {
        console.error("Error fetching gym data:", error);
        // Re-throw the error to be handled by the caller or Next.js error boundary
        throw error;
    }
};

/**
 * Fetches historical occupancy data for a specific gym for the current day (in Perth timezone).
 * @param gymName - The name of the gym to fetch stats for.
 * @returns A Promise resolving to an array of gym occupancy records for the day, ordered by time.
 */
export const getGymStats = async (gymName: string) => {
    const t0 = performance.now();
    try {
        // Get the current time in Perth timezone
        const nowInPerth = dayjs().tz("Australia/Perth");
        // Get the start of the current day (midnight) in Perth timezone
        const startOfDayInPerth = nowInPerth.startOf("day");

        // Fetch records from the database
        const data = await db
            .select()
            .from(revoGymCount)
            .where(
                and(
                    // Filter by the specified gym name
                    eq(revoGymCount.gymName, gymName),
                    // Filter records created on or after the start of the day (in UTC)
                    gte(revoGymCount.created, startOfDayInPerth.utc().format()),
                    // Filter records created on or before the current time (in UTC)
                    lte(revoGymCount.created, nowInPerth.utc().format()),
                ),
            )
            // Order chronologically
            .orderBy(asc(revoGymCount.created));
        const t1 = performance.now();

        // Log the time taken to fetch the data
        console.log(
            `Time taken to fetch gym stats for ${gymName}: ${t1 - t0}ms`,
        );

        return data;
    } catch (error) {
        console.error(`Error fetching gym stats for ${gymName}:`, error);
        // Re-throw the error
        throw error;
    }
};
