import { Gym, GymResponse } from "@/app/gyms/_types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema";
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
export const getGyms = async (
    gyms?: string[],
    sort: { key: string; direction: "asc" | "desc" } = {
        key: "percentage",
        direction: "asc",
    },
    showAll: boolean = false,
) => {
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
        } else {
            // Fallback
            orderByClause = asc(revoGymCount.percentage);
        }

        // Determine Base Filter (Timestamp + AreaSize check if sorting by size)
        const baseConditions = [
            eq(revoGymCount.created, latestTimestamp),
            eq(revoGyms.active, 1),
        ];

        if (sort.key === "areaSize") {
            baseConditions.push(gte(revoGyms.areaSize, 1));
        }

        let latestData: Gym[] = [];

        // If no user is logged in, fetch all gyms for the latest timestamp
        if (!userId || showAll) {
            latestData = await db
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
                })
                .from(revoGymCount)
                .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
                .where(and(...baseConditions))
                .orderBy(orderByClause);
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
                    })
                    .from(revoGymCount)
                    .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
                    .where(and(...baseConditions))
                    .orderBy(orderByClause);
            } else {
                // If user has preferences, fetch only the preferred gyms for the latest timestamp
                latestData = await db
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
                    })
                    .from(revoGymCount)
                    .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
                    .where(
                        and(
                            ...baseConditions,
                            // Filter by gyms present in the user's preferences array
                            inArray(
                                revoGymCount.gymName,
                                gymPreferences as string[],
                            ),
                        ),
                    )
                    .orderBy(orderByClause);
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
        // Get the gym's timezone
        const gymResult = await db
            .select({ timezone: revoGyms.timezone })
            .from(revoGyms)
            .where(eq(revoGyms.name, gymName))
            .limit(1);

        const gymTimezone = gymResult[0]?.timezone || "Australia/Perth";

        // Get the current time in the gym's timezone
        const nowInGymTz = dayjs().tz(gymTimezone);
        // Get the start of the current day (midnight) in the gym's timezone
        const startOfDayInGymTz = nowInGymTz.startOf("day");

        // Fetch records from the database
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
            })
            .from(revoGymCount)
            .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
            .where(
                and(
                    // Filter by the specified gym name
                    eq(revoGymCount.gymName, gymName),
                    // Filter records created on or after the start of the day (in UTC)
                    gte(revoGymCount.created, startOfDayInGymTz.utc().format()),
                    // Filter records created on or before the current time (in UTC)
                    lte(revoGymCount.created, nowInGymTz.utc().format()),
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

export type TrendSlot = {
    time: string;
    average: number;
    sampleCount: number;
};

export type GymTrend = {
    dayOfWeek: number;
    slots: TrendSlot[];
};

/**
 * Fetches the trend data for all gyms from the API.
 */
export const getAllTrends = async (): Promise<Record<string, GymTrend[]>> => {
    try {
        const response = await fetch("https://revotrackerapi.dvcklab.com/gyms/trends", {
            cache: 'no-store' // Ensure we get fresh data, although it shouldn't change often
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch trends: ${response.statusText}`);
        }

        const json = await response.json();

        if (json.message !== "Success" || !json.data) {
            throw new Error("Invalid trend data format");
        }

        return json.data;
    } catch (error) {
        console.error("Error fetching all trends:", error);
        return {};
    }
}


/**
 * Fetches the trend data for a specific gym and the current day of the week.
 * @param gymId - The ID of the gym (e.g., from revoGyms table or mapped locally).
 */
export const getGymTrend = async (gymId: string): Promise<TrendSlot[]> => {
    try {
        const allTrends = await getAllTrends();
        const gymTrends = allTrends[gymId];

        if (!gymTrends) {
            console.warn(`No trend data found for gym ID: ${gymId}`);
            return [];
        }

        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        // Get gym's timezone
        const gymResult = await db
            .select({ timezone: revoGyms.timezone })
            .from(revoGyms)
            .where(eq(revoGyms.id, gymId))
            .limit(1);

        const gymTimezone = gymResult[0]?.timezone || "Australia/Perth";

        const dayOfWeek = dayjs().tz(gymTimezone).day();

        const todayTrend = gymTrends.find(t => t.dayOfWeek === dayOfWeek);

        return todayTrend?.slots || [];
    } catch (error) {
        console.error(`Error fetching trend for gym ${gymId}:`, error);
        return [];
    }
}

/**
 * Fetches the gym ID for a given gym name.
 */
export const getGymId = async (gymName: string): Promise<string | null> => {
    try {
        const result = await db
            .select({ id: revoGyms.id })
            .from(revoGyms)
            .where(eq(revoGyms.name, gymName))
            .limit(1);

        return result[0]?.id || null;
    } catch (error) {
        console.error(`Error fetching gym ID for ${gymName}:`, error);
        return null;
    }
}

export type GymDetails = {
    address: string;
    postcode: number;
    state: string;
    areaSize: number;
};

/**
 * Fetches detailed information for a specific gym.
 * @param gymName - The name of the gym.
 * @returns A Promise resolving to the gym details or null if not found.
 */
export const getGymDetails = async (gymName: string): Promise<GymDetails | null> => {
    try {
        const result = await db
            .select({
                address: revoGyms.address,
                postcode: revoGyms.postcode,
                state: revoGyms.state,
                areaSize: revoGyms.areaSize,
            })
            .from(revoGyms)
            .where(eq(revoGyms.name, gymName))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error(`Error fetching gym details for ${gymName}:`, error);
        return null;
    }
}
