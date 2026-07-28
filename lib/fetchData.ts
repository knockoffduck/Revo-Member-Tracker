import { Gym, GymResponse } from "@/app/gyms/_types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { createPublicPb } from "@/lib/server/pocketbase";
import type PocketBase from "pocketbase";
import { getCurrentUser } from "@/lib/current-user";
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

/**
 * Builds a parameterized PocketBase filter matching any of the given values for
 * a field, e.g. `(id={:v0} || id={:v1})`. Values are auto-escaped by pb.filter,
 * so this is safe for user-controlled input (unlike manual string escaping).
 */
const buildInFilter = (pb: PocketBase, field: string, values: string[]): string => {
    const params: Record<string, string> = {};
    const clauses = values.map((value, i) => {
        params[`v${i}`] = value;
        return `${field}={:v${i}}`;
    });
    return pb.filter(`(${clauses.join(" || ")})`, params);
};

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
    name: string;
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

type PbRecord = Record<string, unknown>;

const mapGymMeta = (record: PbRecord): GymMeta => ({
    id: String(record.id),
    name: String(record.name ?? ""),
    timezone: String(record.timezone ?? "Australia/Perth"),
    address: String(record.address ?? ""),
    postcode: Number(record.postcode ?? 0),
    state: String(record.state ?? ""),
    areaSize: Number(record.area_size ?? 0),
    latitude: record.latitude == null ? null : Number(record.latitude),
    longitude: record.longitude == null ? null : Number(record.longitude),
    squatRacks: Number(record.Squat_Racks ?? 0),
});

const mapGym = (record: PbRecord, meta?: GymMeta | null): Gym => ({
    id: String(record.id),
    created: String(record.created),
    count: Number(record.count ?? 0),
    ratio: Number(record.ratio ?? 0),
    gymName: String(record.gym_name ?? record.name ?? ""),
    percentage: Number(record.percentage ?? 0),
    gymId: String(record.gym_id ?? record.id),
    areaSize: meta?.areaSize ?? 0,
    state: meta?.state ?? "",
    timezone: meta?.timezone ?? "Australia/Perth",
    squatRacks: meta?.squatRacks ?? 0,
});

const fetchGymMeta = async (gymName: string): Promise<GymMeta | null> => {
    const pb = createPublicPb();
    const result = await pb.collection("Revo_Gyms").getList(1, 1, {
        filter: pb.filter("name={:name}", { name: gymName }),
    });

    return result.items[0] ? mapGymMeta(result.items[0]) : null;
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
        const pb = createPublicPb();

        // Find the timestamp of the most recent entry
        const latestPage = await pb.collection("Revo_Gym_Count").getList(1, 1, {
            sort: "-created",
        });

        const latestTimestamp = latestPage.items[0]?.created;
        if (!latestTimestamp) {
            throw new Error("No entries found in the database");
        }

        // Attempt to get the current user session
        const user = await getCurrentUser();
        const userId = user?.id;

        // Fetch all count records for the latest timestamp.
        // Use a minute-wide range so the query can use the created index
        // (LIKE/regex filters cannot use a B-tree index on a 6M-row table).
        const minutePrefix = latestTimestamp.slice(0, 16);
        const filterParts = [
            `created>='${minutePrefix}:00' && created<='${minutePrefix}:59'`,
        ];
        if (gyms && gyms.length > 0) {
            filterParts.push(buildInFilter(pb, "gym_name", gyms));
        }

        const latestRecords = await pb.collection("Revo_Gym_Count").getFullList<PbRecord>({
            filter: filterParts.join(" && "),
            batch: 200,
        });

        // Fetch active gym metadata for all referenced gyms
        const gymIds = [...new Set(latestRecords.map((r) => String(r.gym_id)).filter(Boolean))];
        const gymMetaMap = new Map<string, GymMeta>();
        if (gymIds.length > 0) {
            const metaFilterParts = [buildInFilter(pb, "id", gymIds), "active=true"];
            const metaRecords = await pb.collection("Revo_Gyms").getFullList({
                filter: metaFilterParts.join(" && "),
                batch: 200,
            });
            for (const record of metaRecords) {
                gymMetaMap.set(record.id, mapGymMeta(record));
            }
        }

        let latestData: Gym[] = latestRecords
            .filter((record) => gymMetaMap.has(String(record.gym_id)))
            .map((record) => mapGym(record, gymMetaMap.get(String(record.gym_id))!));

        // Apply user preferences filter
        if (userId && !showAll) {
            const preferences = user?.gymPreferences ?? [];
            if (preferences.length > 0) {
                latestData = latestData.filter((g) => preferences.includes(g.gymName));
            }
        }

        // Apply area/rack filters
        if (sort.key === "areaSize") {
            latestData = latestData.filter((g) => g.areaSize >= 1);
        }
        if (sort.key === "rackAmount") {
            latestData = latestData.filter((g) => g.squatRacks >= 1);
        }

        // Apply sorting
        const sortKey = sort.key as GymResponse["data"][number] extends infer T ? keyof T : never;
        const direction = sort.direction === "asc" ? 1 : -1;
        if (sort.key === "gymName") {
            latestData.sort((a, b) => direction * a.gymName.localeCompare(b.gymName));
        } else if (sort.key === "percentage") {
            latestData.sort((a, b) => direction * (a.percentage - b.percentage));
        } else if (sort.key === "areaSize") {
            latestData.sort((a, b) => direction * (a.areaSize - b.areaSize));
        } else if (sort.key === "count") {
            latestData.sort((a, b) => direction * (a.count - b.count));
        } else if (sort.key === "rackAmount") {
            latestData.sort((a, b) => direction * (a.squatRacks - b.squatRacks));
        } else {
            latestData.sort((a, b) => direction * (a.percentage - b.percentage));
        }

        if (sort.key === "perRack") {
            latestData.sort((a, b) => {
                const ratioA = a.squatRacks > 0 ? a.count / a.squatRacks : Infinity;
                const ratioB = b.squatRacks > 0 ? b.count / b.squatRacks : Infinity;
                return sort.direction === "asc" ? ratioA - ratioB : ratioB - ratioA;
            });
        }

        const result: GymResponse = {
            timestamp: latestTimestamp,
            data: latestData,
        };
        return result;
    } catch (error) {
        const err = error as Error & { url?: string; status?: number; response?: unknown };
        console.error("Error fetching gym data:", {
            message: err?.message,
            url: err?.url,
            status: err?.status,
            response: err?.response,
        });
        throw error;
    }
};

/**
 * Fetches historical occupancy data for a specific gym for the current day (in the gym's timezone).
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

        const pb = createPublicPb();
        // PocketBase stores `created` as "YYYY-MM-DD HH:mm:ss.SSSZ" (space, not T).
        // Format boundaries to match that representation for correct string comparison.
        const startUtc = startOfDayInGymTz.utc().format("YYYY-MM-DD HH:mm:ss") + "Z";
        const endUtc = endOfDayInGymTz.utc().format("YYYY-MM-DD HH:mm:ss") + "Z";
        const records = await pb.collection("Revo_Gym_Count").getFullList<PbRecord>({
            filter: pb.filter(
                "gym_id={:gymId} && created>={:start} && created<={:end}",
                { gymId: resolvedGymMeta.id, start: startUtc, end: endUtc },
            ),
            sort: "created",
            batch: 500,
        });

        const data = records.map((record) => ({
            ...mapGym(record, resolvedGymMeta),
            gymName,
        }));
        const t1 = performance.now();

        console.log(`Time taken to fetch gym stats for ${gymName}: ${t1 - t0}ms`);

        return data;
    } catch (error) {
        console.error(`Error fetching gym stats for ${gymName}:`, error);
        throw error;
    }
};

export const getGymLiveSnapshot = async (
    gymName: string,
    gymMeta?: GymMeta | null,
): Promise<Gym | null> => {
    try {
        const resolvedGymMeta = gymMeta ?? (await fetchGymMeta(gymName));

        if (!resolvedGymMeta?.id) {
            return null;
        }

        const pb = createPublicPb();
        const records = await pb.collection("Revo_Gym_Count").getList<PbRecord>(1, 1, {
            filter: pb.filter("gym_id={:gymId}", { gymId: resolvedGymMeta.id }),
            sort: "-created",
        });

        const latestRow = records.items[0];
        if (!latestRow) {
            return null;
        }

        return {
            ...mapGym(latestRow, resolvedGymMeta),
            gymName,
        };
    } catch (error) {
        console.error(`Error fetching live gym snapshot for ${gymName}:`, error);
        return null;
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

                console.log(`Fetched gym trends in ${performance.now() - startedAt}ms`);

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
 */
export const getNearbyGyms = async (
    gymName: string,
    radiusKm: number = 20,
    maxResults: number = 5
): Promise<NearbyGym[]> => {
    try {
        const pb = createPublicPb();

        const referenceGym = await pb.collection("Revo_Gyms").getList(1, 1, {
            filter: pb.filter("name={:name}", { name: gymName }),
        });

        if (!referenceGym.items.length) {
            console.warn(`Reference gym not found: ${gymName}`);
            return [];
        }

        const refRecord = referenceGym.items[0];
        const refMeta = mapGymMeta(refRecord);

        let refLat = refMeta.latitude;
        let refLng = refMeta.longitude;

        if (!refLat || !refLng) {
            const coords = getPostcodeCoordinates(refMeta.postcode);
            if (!coords) {
                console.warn(`No coordinates found for postcode: ${refMeta.postcode}`);
                return [];
            }
            refLat = coords.lat;
            refLng = coords.lng;
        }

        // Get the latest timestamp
        const latestPage = await pb.collection("Revo_Gym_Count").getList(1, 1, {
            sort: "-created",
        });
        const latestTimestamp = latestPage.items[0]?.created;
        if (!latestTimestamp) {
            return [];
        }

        const minutePrefix = latestTimestamp.slice(0, 16);
        const allRecords = await pb.collection("Revo_Gym_Count").getFullList<PbRecord>({
            filter: pb.filter(
                "created>={:start} && created<={:end} && gym_id!={:refId}",
                { start: `${minutePrefix}:00`, end: `${minutePrefix}:59`, refId: refRecord.id },
            ),
            batch: 200,
        });

        const gymIds = [...new Set(allRecords.map((r) => String(r.gym_id)).filter(Boolean))];
        const gymMetaMap = new Map<string, GymMeta>();
        if (gymIds.length > 0) {
            const metaFilterParts = [buildInFilter(pb, "id", gymIds), "active=true"];
            const metaRecords = await pb.collection("Revo_Gyms").getFullList<PbRecord>({
                filter: metaFilterParts.join(" && "),
                batch: 200,
            });
            for (const record of metaRecords) {
                gymMetaMap.set(String(record.id), mapGymMeta(record));
            }
        }

        const nearbyGyms: NearbyGym[] = [];

        for (const record of allRecords) {
            const meta = gymMetaMap.get(String(record.gym_id));
            if (!meta) continue;

            let gymLat = meta.latitude;
            let gymLng = meta.longitude;

            if (!gymLat || !gymLng) {
                const coords = getPostcodeCoordinates(meta.postcode);
                if (!coords) continue;
                gymLat = coords.lat;
                gymLng = coords.lng;
            }

            const distance = calculateDistance(refLat, refLng, gymLat, gymLng);

            if (distance <= radiusKm) {
                nearbyGyms.push({
                    gymName: String(record.gym_name ?? meta.name),
                    percentage: Number(record.percentage ?? 0),
                    distanceKm: Math.round(distance * 10) / 10,
                    state: meta.state,
                });
            }
        }

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
 */
export const getNearbyGymsByPostcode = async (
    postcode: number,
    radiusKm: number = 20,
    maxResults: number = 5
): Promise<NearbyGym[]> => {
    try {
        const coords = getPostcodeCoordinates(postcode);
        if (!coords) {
            console.warn(`No coordinates found for postcode: ${postcode}`);
            return [];
        }

        const refLat = coords.lat;
        const refLng = coords.lng;

        const pb = createPublicPb();

        const latestPage = await pb.collection("Revo_Gym_Count").getList(1, 1, {
            sort: "-created",
        });
        const latestTimestamp = latestPage.items[0]?.created;
        if (!latestTimestamp) {
            return [];
        }

        const minutePrefix = latestTimestamp.slice(0, 16);
        const allRecords = await pb.collection("Revo_Gym_Count").getFullList<PbRecord>({
            filter: `created>='${minutePrefix}:00' && created<='${minutePrefix}:59'`,
            batch: 200,
        });

        const gymIds = [...new Set(allRecords.map((r) => String(r.gym_id)).filter(Boolean))];
        const gymMetaMap = new Map<string, GymMeta>();
        if (gymIds.length > 0) {
            const metaFilterParts = [buildInFilter(pb, "id", gymIds), "active=true"];
            const metaRecords = await pb.collection("Revo_Gyms").getFullList<PbRecord>({
                filter: metaFilterParts.join(" && "),
                batch: 200,
            });
            for (const record of metaRecords) {
                gymMetaMap.set(String(record.id), mapGymMeta(record));
            }
        }

        const nearbyGyms: NearbyGym[] = [];

        for (const record of allRecords) {
            const meta = gymMetaMap.get(String(record.gym_id));
            if (!meta) continue;

            let gymLat = meta.latitude;
            let gymLng = meta.longitude;

            if (!gymLat || !gymLng) {
                const gymCoords = getPostcodeCoordinates(meta.postcode);
                if (!gymCoords) continue;
                gymLat = gymCoords.lat;
                gymLng = gymCoords.lng;
            }

            const distance = calculateDistance(refLat, refLng, gymLat, gymLng);

            if (distance <= radiusKm) {
                nearbyGyms.push({
                    gymName: String(record.gym_name ?? meta.name),
                    percentage: Number(record.percentage ?? 0),
                    distanceKm: Math.round(distance * 10) / 10,
                    state: meta.state,
                });
            }
        }

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
