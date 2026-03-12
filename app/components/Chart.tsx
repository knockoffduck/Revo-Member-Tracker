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
  description?: string;
  emptyMessage?: string;
  currentCount?: number | null;
  insight?: string | null;
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

export default function Chart({
  data,
  trendData = [],
  description = "Today's activity vs Average",
  emptyMessage = "No activity data available for this day.",
  currentCount,
  insight,
}: ChartProps) {
  // Generate unified 24-hour view
  const chartData = create24HourTimeline(data, trendData);
  const hasCurrentData = data.length > 0;
  const formattedCurrentCount =
    typeof currentCount === "number"
      ? new Intl.NumberFormat("en-AU").format(currentCount)
      : null;

  return (
    <Card className="w-full">
      <CardHeader className="gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid flex-1 gap-1 text-left">
            <CardTitle className="text-2xl sm:text-xl">Member Count</CardTitle>
            <CardDescription className="max-w-[28rem] text-sm leading-relaxed">
              {description}
            </CardDescription>
            {insight ? (
              <p className="pt-1 text-sm font-medium text-foreground/90">
                {insight.charAt(0).toUpperCase() + insight.slice(1)} right now
              </p>
            ) : null}
          </div>
          {formattedCurrentCount ? (
            <div className="hidden rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-left sm:block sm:min-w-[8.5rem] sm:text-right">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
                Live Count
              </p>
              <p className="mt-1 text-4xl font-semibold leading-none tracking-tight sm:text-4xl">
                {formattedCurrentCount}
              </p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
        {hasCurrentData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full text-[11px] sm:h-[250px] sm:text-xs [&_.recharts-cartesian-axis-tick_text]:text-[11px] sm:[&_.recharts-cartesian-axis-tick_text]:text-xs [&_.recharts-legend-wrapper]:!bottom-0 [&_.recharts-default-legend]:flex [&_.recharts-default-legend]:flex-wrap [&_.recharts-default-legend]:items-center [&_.recharts-default-legend]:justify-center [&_.recharts-default-legend]:gap-x-4 [&_.recharts-default-legend]:gap-y-2 [&_.recharts-legend-item]:!mr-0"
          >
            <ComposedChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 8,
                left: -28,
                right: 8,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="created"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={42}
                interval="preserveStartEnd"
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={3}
                width={28}
              />
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
              <Line
                dataKey="average"
                type="monotone"
                stroke="var(--color-average)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
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
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center sm:h-[250px]">
            <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
