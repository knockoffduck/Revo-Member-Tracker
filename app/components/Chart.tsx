"use client";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { TooltipProps } from "recharts";

import { IoTrendingUp } from "react-icons/io5";
import { ValueType } from "tailwindcss/types/config";
import { NameType } from "recharts/types/component/DefaultTooltipContent";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "hsl(var(--chart-1))",
	},
	mobile: {
		label: "Mobile",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

type CountAverages = {
	time: string;
	avg_member_count: number;
	avg_member_ratio: number;
	avg_percentage: number;
};

type ResponseData = {
	time: string;
	aTime: string;
	avg_member_count: number;
	avg_member_ratio: number;
	avg_percentage: number;
}[];

const CustomTooltip = ({
	active,
	payload,
	label,
}: TooltipProps<ValueType, NameType>) => {
	if (active && payload && payload.length) {
		return (
			<div className="p-2 md:p-4 bg-background/70 flex flex-col gap-2 rounded-md">
				<p className="text-sm md:text-lg">{label}</p>
				<p className="text-xs md:text-sm text-[hsl(var(--chart-2))]">
					Member Count:
					<span className="ml-2">{payload[0].value}</span>
				</p>
			</div>
		);
	}
};

export default function Chart({ data }: { data: ResponseData }) {
	// Helper function to normalize time to the nearest 30-minute interval
	console.log(data);

	const getTickValues = (data: ResponseData) => {
		// Ensure there are only 3 ticks
		const length = data.length;
		if (length <= 3) return data.map((item) => item.aTime);

		const interval = Math.floor(length / 3);
		return data
			.filter((_, index) => index % interval === 0)
			.map((item) => item.aTime);
	};

	const ticks = getTickValues(data);

	return (
		<Card className="w-full p-10">
			<CardHeader>
				<CardTitle>Member Count</CardTitle>
				<CardDescription>Showing Average Member Count</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className="md:min-h-[20rem] w-full"
				>
					<AreaChart
						width={500}
						height={400}
						accessibilityLayer
						data={data}
						margin={{
							left: -20,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="aTime"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							ticks={ticks}
						/>
						<YAxis tickLine={false} tickMargin={8} tickCount={3} />
						<Tooltip content={<CustomTooltip />} />
						<Area
							dataKey="avg_member_count"
							type="natural"
							fill="var(--color-mobile)"
							fillOpacity={0.4}
							stroke="var(--color-mobile)"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
