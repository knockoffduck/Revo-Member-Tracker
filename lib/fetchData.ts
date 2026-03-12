import { Gym, GymResponse } from "@/app/gyms/_types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema";
import { and, asc, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { auth } from "./auth";
import { headers } from "next/headers";
import { calculateDistance, getPostcodeCoordinates } from "./postcodeData";
import { unstable_cache } from "next/cache";

// Extend dayjs with necessary plugins for timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Disable caching for Next.js fetch requests made by functions in this file
// Ensures fresh data is always fetched.
export const revalidate = 0;
const TRENDS_CACHE_TTL_MS = 60 * 60 * 1000;

const DATE_FORMAT = "YYYY-MM-DD";

const isValidDateParam = (value?: string) =>
    !!value && dayjs(value, DATE_FORMAT, true).isValid();

export const resolveGymDate = (timezone: string, date?: string) => {
    const todayInGymTz = dayjs().tz(timezone).startOf("day");

    if (!isValidDateParam(date)) {
        return {
            selectedDay: todayInGymTz,
            today: todayInGymTz.format(DATE_FORMAT),
        };
    }

    const requestedDay = dayjs.tz(date, DATE_FORMAT, timezone).startOf("day");

    if (requestedDay.isAfter(todayInGymTz)) {
        return {
            selectedDay: todayInGymTz,
            today: todayInGymTz.format(DATE_FORMAT),
        };
    }

    return {
        selectedDay: requestedDay,
        today: todayInGymTz.format(DATE_FORMAT),
    };
};

export type GymMeta = {
    id: string;
    timezone: string;
    address: string;
    postcode: number;
    state: string;
    areaSize: number;
    latitude: number | null;
    longitude: number | null;
    squatRacks: number;
};

let trendsCache:
    | {
          data: Record<string, GymTrend[]>;
          expiresAt: number;
      }
    | null = null;
let trendsCachePromise: Promise<Record<string, GymTrend[]>> | null = null;

const fetchGymMeta = async (gymName: string): Promise<GymMeta | null> => {
    const result = await db
        .select({
            id: revoGyms.id,
            timezone: revoGyms.timezone,
            address: revoGyms.address,
            postcode: revoGyms.postcode,
            state: revoGyms.state,
            areaSize: revoGyms.areaSize,
            latitude: revoGyms.latitude,
            longitude: revoGyms.longitude,
            squatRacks: revoGyms.squatRacks,
        })
        .from(revoGyms)
        .where(eq(revoGyms.name, gymName))
        .limit(1);

    return result[0] || null;
};

export const getGymMeta = async (gymName: string): Promise<GymMeta | null> => {
    try {
        return await fetchGymMeta(gymName);
    } catch (error) {
        console.error(`Error fetching gym metadata for ${gymName}:`, error);
        return null;
    }
};

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

        // Determine Base Filter (Timestamp + AreaSize check if sorting by size)
        const baseConditions = [
            eq(revoGymCount.created, latestTimestamp),
            eq(revoGyms.active, 1),
        ];

        if (sort.key === "areaSize") {
            baseConditions.push(gte(revoGyms.areaSize, 1));
        }

        if (sort.key === "rackAmount") {
            baseConditions.push(gte(revoGyms.squatRacks, 1));
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
                    squatRacks: revoGyms.squatRacks,
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
                        squatRacks: revoGyms.squatRacks,
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
                        squatRacks: revoGyms.squatRacks,
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

        // Apply client-side sorting for perRack (calculated field)
        if (sort.key === "perRack") {
            latestData.sort((a, b) => {
                const ratioA = a.squatRacks > 0 ? a.count / a.squatRacks : Infinity;
                const ratioB = b.squatRacks > 0 ? b.count / b.squatRacks : Infinity;
                return sort.direction === "asc" ? ratioA - ratioB : ratioB - ratioA;
            });
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
export const getGymStats = async (
    gymName: string,
    date?: string,
    gymMeta?: GymMeta | null,
) => {
    const t0 = performance.now();
    try {
        const resolvedGymMeta = gymMeta ?? (await fetchGymMeta(gymName));
        const gymTimezone = resolvedGymMeta?.timezone || "Australia/Perth";

        const { selectedDay } = resolveGymDate(gymTimezone, date);
        const startOfDayInGymTz = selectedDay.startOf("day");
        const endOfDayInGymTz = selectedDay.endOf("day");

        if (!resolvedGymMeta?.id) {
            return [];
        }

        const rows = await db
            .select({
                id: revoGymCount.id,
                created: revoGymCount.created,
                count: revoGymCount.count,
                ratio: revoGymCount.ratio,
                gymName: revoGymCount.gymName,
                percentage: revoGymCount.percentage,
                gymId: revoGymCount.gymId,
            })
            .from(revoGymCount)
            .where(
                and(
                    eq(revoGymCount.gymId, resolvedGymMeta.id),
                    gte(revoGymCount.created, startOfDayInGymTz.utc().format()),
                    lte(revoGymCount.created, endOfDayInGymTz.utc().format()),
                ),
            )
            .orderBy(asc(revoGymCount.created));

        const data = rows.map((row) => ({
            ...row,
            gymName,
            areaSize: resolvedGymMeta.areaSize,
            state: resolvedGymMeta.state,
            timezone: resolvedGymMeta.timezone,
            squatRacks: resolvedGymMeta.squatRacks,
        }));
        const t1 = performance.now();

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
        const now = Date.now();
        if (trendsCache && trendsCache.expiresAt > now) {
            return trendsCache.data;
        }

        if (!trendsCachePromise) {
            trendsCachePromise = (async () => {
                const startedAt = performance.now();
                const response = await fetch("https://revotrackerapi.dvcklab.com/gyms/trends", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch trends: ${response.statusText}`);
                }

                const json = await response.json();

                if (json.message !== "Success" || !json.data) {
                    throw new Error("Invalid trend data format");
                }

                trendsCache = {
                    data: json.data,
                    expiresAt: Date.now() + TRENDS_CACHE_TTL_MS,
                };

                console.log(
                    `Fetched gym trends in ${performance.now() - startedAt}ms`,
                );

                return json.data;
            })().finally(() => {
                trendsCachePromise = null;
            });
        }

        return await trendsCachePromise;
    } catch (error) {
        console.error("Error fetching all trends:", error);
        return {};
    }
}


/**
 * Fetches the trend data for a specific gym and the current day of the week.
 * @param gymId - The ID of the gym (e.g., from revoGyms table or mapped locally).
 */
export const getGymTrend = async (
    gymId: string,
    gymTimezone: string = "Australia/Perth",
): Promise<TrendSlot[]> => {
    try {
        const allTrends = await getAllTrends();
        const gymTrends = allTrends[gymId];

        if (!gymTrends) {
            console.warn(`No trend data found for gym ID: ${gymId}`);
            return [];
        }

        const dayOfWeek = dayjs().tz(gymTimezone).day();

        const todayTrend = gymTrends.find(t => t.dayOfWeek === dayOfWeek);

        return todayTrend?.slots || [];
    } catch (error) {
        console.error(`Error fetching trend for gym ${gymId}:`, error);
        return [];
    }
}

export type GymDetails = {
    address: string;
    postcode: number;
    state: string;
    areaSize: number;
    timezone: string;
};

/**
 * Fetches detailed information for a specific gym.
 * @param gymName - The name of the gym.
 * @returns A Promise resolving to the gym details or null if not found.
 */
export const getGymDetails = async (gymName: string): Promise<GymDetails | null> => {
    try {
        const result = await fetchGymMeta(gymName);

        if (!result) {
            return null;
        }

        return {
            address: result.address,
            postcode: result.postcode,
            state: result.state,
            areaSize: result.areaSize,
            timezone: result.timezone,
        };
    } catch (error) {
        console.error(`Error fetching gym details for ${gymName}:`, error);
        return null;
    }
}

export const getGymDateMeta = async (gymName: string, date?: string) => {
    try {
        const gymMeta = await fetchGymMeta(gymName);
        const timezone = gymMeta?.timezone || "Australia/Perth";
        const { selectedDay, today } = resolveGymDate(timezone, date);

        return {
            timezone,
            selectedDate: selectedDay.format(DATE_FORMAT),
            todayDate: today,
            isToday: selectedDay.format(DATE_FORMAT) === today,
        };
    } catch (error) {
        console.error(`Error fetching date metadata for ${gymName}:`, error);

        const timezone = "Australia/Perth";
        const today = dayjs().tz(timezone).format(DATE_FORMAT);

        return {
            timezone,
            selectedDate: today,
            todayDate: today,
            isToday: true,
        };
    }
};

export type NearbyGym = {
    gymName: string;
    percentage: number;
    distanceKm: number;
    state: string;
};

/**
 * Fetches nearby gyms that are less crowded than the current gym.
 * @param gymName - The name of the reference gym.
 * @param radiusKm - Maximum distance in kilometres (default: 20).
 * @param maxResults - Maximum number of results to return (default: 5).
 * @returns A Promise resolving to an array of nearby gyms sorted by crowd level (ascending).
 */
export const getNearbyGyms = async (
    gymName: string,
    radiusKm: number = 20,
    maxResults: number = 5
): Promise<NearbyGym[]> => {
    try {
        // Get the reference gym's details including postcode
        const referenceGym = await db
            .select({
                postcode: revoGyms.postcode,
                latitude: revoGyms.latitude,
                longitude: revoGyms.longitude,
            })
            .from(revoGyms)
            .where(eq(revoGyms.name, gymName))
            .limit(1);

        if (!referenceGym || referenceGym.length === 0) {
            console.warn(`Reference gym not found: ${gymName}`);
            return [];
        }

        const refGym = referenceGym[0];

        // Get coordinates - use stored lat/lng or fallback to postcode lookup
        let refLat = refGym.latitude;
        let refLng = refGym.longitude;

        if (!refLat || !refLng) {
            const coords = getPostcodeCoordinates(refGym.postcode);
            if (!coords) {
                console.warn(`No coordinates found for postcode: ${refGym.postcode}`);
                return [];
            }
            refLat = coords.lat;
            refLng = coords.lng;
        }

        // Get the latest timestamp
        const latestTimeResult = await db
            .select({ created: revoGymCount.created })
            .from(revoGymCount)
            .orderBy(desc(revoGymCount.created))
            .limit(1);

        if (!latestTimeResult || latestTimeResult.length === 0) {
            return [];
        }
        const latestTimestamp = latestTimeResult[0].created;

        // Get all active gyms except the reference gym with their current crowd levels
        const allGyms = await db
            .select({
                gymName: revoGymCount.gymName,
                percentage: revoGymCount.percentage,
                postcode: revoGyms.postcode,
                latitude: revoGyms.latitude,
                longitude: revoGyms.longitude,
                state: revoGyms.state,
            })
            .from(revoGymCount)
            .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
            .where(
                and(
                    eq(revoGymCount.created, latestTimestamp),
                    eq(revoGyms.active, 1),
                    ne(revoGyms.name, gymName)
                )
            );

        // Calculate distances and filter by radius
        const nearbyGyms: NearbyGym[] = [];

        for (const gym of allGyms) {
            let gymLat = gym.latitude;
            let gymLng = gym.longitude;

            // Fallback to postcode lookup if no stored coordinates
            if (!gymLat || !gymLng) {
                const coords = getPostcodeCoordinates(gym.postcode);
                if (!coords) continue; // Skip if no coordinates available
                gymLat = coords.lat;
                gymLng = coords.lng;
            }

            const distance = calculateDistance(refLat, refLng, gymLat, gymLng);

            if (distance <= radiusKm) {
                nearbyGyms.push({
                    gymName: gym.gymName,
                    percentage: gym.percentage,
                    distanceKm: Math.round(distance * 10) / 10, // Round to 1 decimal
                    state: gym.state as string,
                });
            }
        }

        // Sort by percentage (ascending - less crowded first), then by distance
        nearbyGyms.sort((a, b) => {
            if (a.percentage !== b.percentage) {
                return a.percentage - b.percentage;
            }
            return a.distanceKm - b.distanceKm;
        });

        return nearbyGyms.slice(0, maxResults);
    } catch (error) {
        console.error(`Error fetching nearby gyms for ${gymName}:`, error);
        return [];
    }
};

export const getCachedNearbyGyms = async (
    gymName: string,
    radiusKm: number = 20,
    maxResults: number = 5,
): Promise<NearbyGym[]> => {
    const cachedFetcher = unstable_cache(
        async () => getNearbyGyms(gymName, radiusKm, maxResults),
        [`nearby-gyms:${gymName}:${radiusKm}:${maxResults}`],
        { revalidate: 60 },
    );

    return cachedFetcher();
};

/**
 * Fetches nearby gyms based on a postcode instead of a gym name.
 * @param postcode - The reference postcode.
 * @param radiusKm - Maximum distance in kilometres (default: 20).
 * @param maxResults - Maximum number of results to return (default: 5).
 * @returns A Promise resolving to an array of nearby gyms sorted by crowd level (ascending).
 */
export const getNearbyGymsByPostcode = async (
    postcode: number,
    radiusKm: number = 20,
    maxResults: number = 5
): Promise<NearbyGym[]> => {
    try {
        // Get coordinates from postcode
        const coords = getPostcodeCoordinates(postcode);
        if (!coords) {
            console.warn(`No coordinates found for postcode: ${postcode}`);
            return [];
        }

        const refLat = coords.lat;
        const refLng = coords.lng;

        // Get the latest timestamp
        const latestTimeResult = await db
            .select({ created: revoGymCount.created })
            .from(revoGymCount)
            .orderBy(desc(revoGymCount.created))
            .limit(1);

        if (!latestTimeResult || latestTimeResult.length === 0) {
            return [];
        }
        const latestTimestamp = latestTimeResult[0].created;

        // Get all active gyms with their current crowd levels
        const allGyms = await db
            .select({
                gymName: revoGymCount.gymName,
                percentage: revoGymCount.percentage,
                postcode: revoGyms.postcode,
                latitude: revoGyms.latitude,
                longitude: revoGyms.longitude,
                state: revoGyms.state,
            })
            .from(revoGymCount)
            .innerJoin(revoGyms, eq(revoGymCount.gymId, revoGyms.id))
            .where(
                and(
                    eq(revoGymCount.created, latestTimestamp),
                    eq(revoGyms.active, 1)
                )
            );

        // Calculate distances and filter by radius
        const nearbyGyms: NearbyGym[] = [];

        for (const gym of allGyms) {
            let gymLat = gym.latitude;
            let gymLng = gym.longitude;

            // Fallback to postcode lookup if no stored coordinates
            if (!gymLat || !gymLng) {
                const gymCoords = getPostcodeCoordinates(gym.postcode);
                if (!gymCoords) continue;
                gymLat = gymCoords.lat;
                gymLng = gymCoords.lng;
            }

            const distance = calculateDistance(refLat, refLng, gymLat, gymLng);

            if (distance <= radiusKm) {
                nearbyGyms.push({
                    gymName: gym.gymName,
                    percentage: gym.percentage,
                    distanceKm: Math.round(distance * 10) / 10,
                    state: gym.state as string,
                });
            }
        }

        // Sort by percentage (ascending), then by distance
        nearbyGyms.sort((a, b) => {
            if (a.percentage !== b.percentage) {
                return a.percentage - b.percentage;
            }
            return a.distanceKm - b.distanceKm;
        });

        return nearbyGyms.slice(0, maxResults);
    } catch (error) {
        console.error(`Error fetching nearby gyms for postcode ${postcode}:`, error);
        return [];
    }
};
