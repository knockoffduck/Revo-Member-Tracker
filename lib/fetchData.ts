import { supabaseClient } from "./supabaseClient";
import { Gym } from "@/app/_types";
import { PostgrestResponse } from "@supabase/supabase-js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { convertToLocalHour, convertUTCToLocalTime } from "./utils";

dayjs.extend(utc);
dayjs.extend(timezone);

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

export const getGymStats = async (gymName: string) => {
	const supabase = supabaseClient();

	const nowInPerth = dayjs().tz("Australia/Perth");

	// Get midnight time in Australia/Perth timezone
	const startOfDayInPerth = nowInPerth.startOf("day");

	const { data, error } = await supabase
		.from("Revo Member Stats")
		.select("*")
		.eq("name", gymName)
		.gte("created_at", startOfDayInPerth.utc().format())
		.lte("created_at", nowInPerth.utc().format())
		.order("id", { ascending: true }); // Adjust the order parameter here

	if (error) {
		console.error("Error fetching data: ", error);
		return [];
	}
	const roundTo30Minutes = (date: Date): string => {
		const msIn30Minutes = 30 * 60 * 1000;

		const roundedTime = new Date(
			Math.round(date.getTime() / msIn30Minutes) * msIn30Minutes
		);
		return roundedTime.toISOString().substring(0, 16); // Returns YYYY-MM-DDTHH:MM
	};

	// Grouping data by 30-minute intervals and averaging the values
	const groupedData: {
		[key: string]: {
			member_count: number[];
			member_ratio: number[];
			percentage: number[];
		};
	} = {};

	data.forEach((item) => {
		const localTime = convertUTCToLocalTime(new Date(item.created_at));
		const roundedTime = roundTo30Minutes(localTime);
		const time = convertToLocalHour(roundedTime);
		// Normalize time to the nearest 30 minutes

		if (!groupedData[time]) {
			groupedData[time] = {
				member_count: [],
				member_ratio: [],
				percentage: [],
			};
		}

		groupedData[time].member_count.push(item.member_count);
		groupedData[time].member_ratio.push(item.member_ratio);
		groupedData[time].percentage.push(item.percentage);
	});

	// Function to calculate the average of an array
	const average = (arr: number[]): number =>
		arr.reduce((sum, val) => sum + val, 0) / arr.length;

	// Create the final grouped result with averages
	const averagedData = Object.entries(groupedData).map(([time, values]) => {
		return {
			time,
			aTime: dayjs(`2024-01-01T${time}`).format("h:mm A"),
			avg_member_count: Math.round(average(values.member_count)),
			avg_member_ratio: Math.round(average(values.member_ratio)),
			avg_percentage: Math.round(average(values.percentage)),
		};
	});
	return averagedData;
};
