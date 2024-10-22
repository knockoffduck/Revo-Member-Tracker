import Chart from "@/app/components/Chart";
import { Card, CardHeader } from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabaseClient";

const convertToPerthHour = (isoString: string): string => {
	const date = new Date(isoString);

	// Format the date to Perth time (UTC+8)
	const perthTimeFormatter = new Intl.DateTimeFormat("en-AU", {
		timeZone: "Australia/Perth", // Convert to Perth timezone
		hour: "2-digit",
		minute: "2-digit",
		hour12: false, // 24-hour format
	});

	return perthTimeFormatter.format(date);
};

function convertUTCToPerthTime(utcDate: Date): Date {
	// Get the UTC time in milliseconds
	const utcTime = utcDate.getTime();

	// Perth is UTC+8, so calculate the offset (in milliseconds)
	const perthOffset = 8 * 60 * 60 * 1000; // UTC+8 in milliseconds

	// Create a new Date object adjusted to Perth time
	const perthDate = new Date(utcTime + perthOffset);

	return perthDate;
}

export default async function page({ params }: { params: { name: string } }) {
	const supabase = supabaseClient();
	const gymName = decodeURIComponent(params.name);

	const today = new Date();

	// Offset for Perth timezone (UTC+8)
	const perthOffset = 8 * 60; // Offset in minutes

	// Get current date in Perth timezone
	const perthToday = new Date(today.getTime() + perthOffset * 60 * 1000);

	// Format the date as YYYY-MM-DD for the Perth timezone
	const perthTodayDate = perthToday.toISOString().split("T")[0];

	// Get the start of the day in UTC (Perth midnight in UTC)
	const perthMidnightUTC = new Date(
		`${perthTodayDate}T00:00:00.000+08:00`
	).toISOString();

	// Get the end of the day in UTC (Perth 23:59:59 in UTC)
	const perthEndOfDayUTC = new Date(
		`${perthTodayDate}T23:59:59.999+08:00`
	).toISOString();

	// Query for records created today (in Perth time)
	const { data, error } = await supabase
		.from("Revo Member Stats")
		.select()
		.eq("name", gymName)
		.gte("created_at", perthMidnightUTC)
		.lt("created_at", perthEndOfDayUTC);

	if (error) {
		console.error("Error fetching data: ", error.message);
		return <div>Error fetching data</div>;
	}

	// Safeguard: if data is not available or empty
	if (!data || data.length === 0) {
		return <div>No data available for {gymName}</div>;
	}

	// Helper function to normalize time to the nearest 30-minute interval
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
		const perthTime = convertUTCToPerthTime(new Date(item.created_at));
		const roundedTime = roundTo30Minutes(perthTime);
		const time = convertToPerthHour(roundedTime);
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
			avg_member_count: Math.round(average(values.member_count)),
			avg_member_ratio: Math.round(average(values.member_ratio)),
			avg_percentage: Math.round(average(values.percentage)),
		};
	});

	return (
		<Card className="p-6 border-0 grid justify-center">
			<CardHeader className="text-center font-bold text-2xl">
				{gymName}
			</CardHeader>
			<Chart data={averagedData}></Chart>
		</Card>
	);
}
