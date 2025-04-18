import { Gym, GymResponse } from "@/app/_types";
import { PostgrestResponse } from "@supabase/supabase-js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { convertToLocalHour, convertUTCToLocalTime } from "./utils";
import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { raw } from "mysql2";
import { auth } from "./auth";
import { headers } from "next/headers";

dayjs.extend(utc);
dayjs.extend(timezone);

export const revalidate = 0;

export const getGyms = async (gyms?: string[]) => {
	let latestData: Gym[] = [];
	try {
		const latestTime = await db
			.select({ created: revoGymCount.created })
			.from(revoGymCount)
			.orderBy(desc(revoGymCount.created))
			.limit(1);
		if (!latestTime) {
			throw new Error("No entries found in the database");
		}
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		const userId = session?.user?.id;
		if (!userId) {
			latestData = await db
				.select()
				.from(revoGymCount)
				.where(eq(revoGymCount.created, latestTime[0].created))
				.orderBy(desc(revoGymCount.percentage));
		} else {
			const gymPreferences = await db
				.select({ gymPreferences: user.gymPreferences })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			latestData = await db
				.select()
				.from(revoGymCount)
				.where(
					and(
						eq(revoGymCount.created, latestTime[0].created),
						inArray(
							revoGymCount.gymName,
							gymPreferences[0].gymPreferences as string[]
						)
					)
				);
		}
		const result: GymResponse = {
			timestamp: latestTime[0].created,
			data: latestData,
		};
		return result;
		// return result;
	} catch (error) {
		console.error("Error fetching gym data:", error);
		throw error;
	}
};

export const getGymStats = async (gymName: string) => {
	// const supabase = supabaseClient();

	const nowInPerth = dayjs().tz("Australia/Perth");

	// Get midnight time in Australia/Perth timezone
	const startOfDayInPerth = nowInPerth.startOf("day");

	const data = await db
		.select()
		.from(revoGymCount)
		.where(
			and(
				eq(revoGymCount.gymName, gymName),
				gte(revoGymCount.created, startOfDayInPerth.utc().format()),
				lte(revoGymCount.created, nowInPerth.utc().format())
			)
		)
		.orderBy(asc(revoGymCount.created));

	// const { data, error } = await supabase
	// 	.from("Revo Member Stats")
	// 	.select("*")
	// 	.eq("name", gymName)
	// 	.gte("created_at", startOfDayInPerth.utc().format())
	// 	.lte("created_at", nowInPerth.utc().format())
	// 	.order("id", { ascending: true }); // Adjust the order parameter here

	// if (error) {
	// 	console.error("Error fetching data: ", error);
	// 	return [];
	// }
	// const roundTo30Minutes = (date: Date): string => {
	// 	const msIn30Minutes = 30 * 60 * 1000;

	// 	const roundedTime = new Date(
	// 		Math.round(date.getTime() / msIn30Minutes) * msIn30Minutes
	// 	);
	// 	return roundedTime.toISOString().substring(0, 16); // Returns YYYY-MM-DDTHH:MM
	// };

	// // Grouping data by 30-minute intervals and averaging the values
	// const groupedData: {
	// 	[key: string]: {
	// 		member_count: number[];
	// 		member_ratio: number[];
	// 		percentage: number[];
	// 	};
	// } = {};

	// data.forEach((item) => {
	// 	// const localTime = convertUTCToLocalTime(new Date(item.created));
	// 	const rawTime = new Date(item.created);
	// 	const stringLocalTime = rawTime.toLocaleString();
	// 	const localTime = new Date(stringLocalTime);

	// 	const roundedTime = roundTo30Minutes(localTime);
	// 	const time = convertToLocalHour(roundedTime);
	// 	// Normalize time to the nearest 30 minutes

	// 	if (!groupedData[time]) {
	// 		groupedData[time] = {
	// 			member_count: [],
	// 			member_ratio: [],
	// 			percentage: [],
	// 		};
	// 	}

	// 	groupedData[time].member_count.push(item.count);
	// 	groupedData[time].member_ratio.push(item.ratio);
	// 	groupedData[time].percentage.push(item.percentage);
	// });

	// data.forEach((item) => {
	// 	const localTime = convertUTCToLocalTime(new Date(item.created_at));
	// 	const roundedTime = roundTo30Minutes(localTime);
	// 	const time = convertToLocalHour(roundedTime);
	// 	// Normalize time to the nearest 30 minutes

	// 	if (!groupedData[time]) {
	// 		groupedData[time] = {
	// 			member_count: [],
	// 			member_ratio: [],
	// 			percentage: [],
	// 		};
	// 	}

	// 	groupedData[time].member_count.push(item.member_count);
	// 	groupedData[time].member_ratio.push(item.member_ratio);
	// 	groupedData[time].percentage.push(item.percentage);
	// });

	// Function to calculate the average of an array
	// const average = (arr: number[]): number =>
	// 	arr.reduce((sum, val) => sum + val, 0) / arr.length;

	// // Create the final grouped result with averages
	// const averagedData = Object.entries(groupedData).map(([time, values]) => {
	// 	return {
	// 		time,
	// 		aTime: dayjs(`2024-01-01T${time}`).format("h:mm A"),
	// 		avg_member_count: Math.round(average(values.member_count)),
	// 		avg_member_ratio: Math.round(average(values.member_ratio)),
	// 		avg_percentage: Math.round(average(values.percentage)),
	// 	};
	// });
	return data;
};
