"use client";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
} from "recharts";

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import { Gym } from "../gyms/_types";
import { TrendSlot } from "@/lib/fetchData";

const chartConfig = {
  count: {
    label: "Current",
    color: "hsl(var(--chart-2))",
  },
  average: {
    label: "Average Trend",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

type ChartProps = {
  data: Gym[];
  trendData?: TrendSlot[];
};

/**
 * Generates a unified 24-hour timeline (00:00 to 23:30)
 * and maps the current data onto it.
 */
function create24HourTimeline(
  currentData: Gym[],
  trendData: TrendSlot[] = [],
): Array<{
  created: string;
  count: number | null;
  average: number | null;
}> {
  // Create a map of current data by time interval
  const currentByTime: Map<string, number> = new Map();

  for (const record of currentData) {
    const date = new Date(record.created);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = (date.getUTCMinutes() < 30 ? 0 : 30).toString().padStart(2, "0");
    const timeKey = `${hours}:${minutes}`;
    // Use the latest value for each interval
    currentByTime.set(timeKey, record.count);
  }

  // Create a map of trend data by time interval
  const trendByTime: Map<string, number> = new Map();
  for (const slot of trendData) {
    trendByTime.set(slot.time, slot.average);
  }

  // Generate 48 intervals for the full day
  const timeline: Array<{ created: string; count: number | null; average: number | null }> = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeKey = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      // Create a date object for this specific time slot
      // We construct a UTC date to match our "Fake UTC" data convention
      const slotDate = new Date(baseDate);
      slotDate.setUTCHours(hour, minute, 0, 0);

      timeline.push({
        created: slotDate.toISOString(),
        count: currentByTime.get(timeKey) ?? null,
        average: trendByTime.get(timeKey) ?? null,
      });
    }
  }

  return timeline;
}

export default function Chart({ data, trendData = [] }: ChartProps) {
  // Generate unified 24-hour view
  const chartData = create24HourTimeline(data, trendData);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Member Count</CardTitle>
          <CardDescription>
            Today&apos;s activity vs Average
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <ComposedChart
            width={500}
            height={400}
            accessibilityLayer
            data={chartData}
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
                  timeZone: "UTC",
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
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "UTC",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Average Trend Line */}
            <Line
              dataKey="average"
              type="monotone"
              stroke="var(--color-average)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
            {/* Current day data - filled area */}
            <Area
              dataKey="count"
              type="natural"
              fill="var(--color-count)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
              strokeWidth={2}
              connectNulls
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


