"use client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "#2563eb",
	},
	mobile: {
		label: "Mobile",
		color: "#60a5fa",
	},
} satisfies ChartConfig;

type CountAverages = {
	time: string;
	avg_member_count: number;
	avg_member_ratio: number;
	avg_percentage: number;
};

type ResponseData = {
	created_at: string;
	id: number;
	member_count: number;
	member_ratio: number;
	name: string;
	percentage: number;
	size: number;
}[];

// Convert ISO string to a localized hour (using browser's local timezone)
const convertToLocalHour = (isoString: string): string => {
	const date = new Date(isoString);

	// Format the date to local timezone (browser's timezone)
	const localTimeFormatter = new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false, // 24-hour format
	});

	return localTimeFormatter.format(date);
};

// Convert UTC date to local browser time
function convertUTCToLocalTime(utcDate: Date): Date {
	// Get the UTC time in milliseconds
	const utcTime = utcDate.getTime();

	// Calculate the offset for the local timezone
	const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

	// Adjust UTC time to local time
	const localDate = new Date(utcTime - timezoneOffset);

	return localDate;
}

export default function Chart({ data }: { data: ResponseData }) {
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
			avg_member_count: Math.round(average(values.member_count)),
			avg_member_ratio: Math.round(average(values.member_ratio)),
			avg_percentage: Math.round(average(values.percentage)),
		};
	});

	return (
		<Card className="max-w-[500px]">
			<CardHeader>
				<CardTitle>Average Member Count</CardTitle>
				<CardDescription>
					Showing average member count per 30 mins
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={averagedData}
						margin={{
							left: 8,
							right: 8,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="time"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Area
							dataKey="avg_member_count"
							type="natural"
							fill="var(--color-desktop)"
							fillOpacity={0.4}
							stroke="var(--color-desktop)"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
