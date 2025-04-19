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
import { Gym } from "../_types";

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

export default function Chart({ data }: { data: Gym[] }) {
  // Helper function to normalize time to the nearest 30-minute interval

  // const getTickValues = (data: ResponseData) => {
  // 	// Ensure there are only 3 ticks
  // 	const length = data.length;
  // 	if (length <= 3) return data.map((item) => item.aTime);

  // 	const interval = Math.floor(length / 3);
  // 	return data
  // 		.filter((_, index) => index % interval === 0)
  // 		.map((item) => item.aTime);
  // };

  // const ticks = getTickValues(data);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Member Count</CardTitle>
          <CardDescription>Showing Average Member Count</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
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
              dataKey="created"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                const options: Intl.DateTimeFormatOptions = {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                };
                return date.toLocaleTimeString("en-AU", options);
              }}
            />
            <YAxis tickLine={false} tickMargin={8} tickCount={3} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleTimeString("en-AU", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }}
                  indicator="dot"
                />
              }
            ></ChartTooltip>
            <Area
              dataKey="count"
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
