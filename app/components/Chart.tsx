"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
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
} from "@/components/ui/chart";

import { Gym } from "../gyms/_types";
import { TrendSlot } from "@/lib/fetchData";

const SLOT_MINUTES = 15;
const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

const chartConfig = {
  count: {
    label: "Current",
    color: "hsl(var(--chart-2))",
  },
  average: {
    label: "Average",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

type Point = {
  key: string;
  at: string;
  count: number | null;
  average: number | null;
};

/**
 * Axis stops on round numbers so the grid reads as scale, not decoration.
 * Steps come from 1/2/2.5/4/5/10 x a power of ten; the smallest step that
 * needs no more than five intervals wins, and the axis tops out exactly on
 * the last step (so 160 reads 0/40/80/120/160 rather than 0/55/160).
 */
function buildScale(values: Array<number | null | undefined>) {
  const numbers = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const max = numbers.length ? Math.max(...numbers) : 0;

  if (max <= 0) {
    return { max: 10, ticks: [0, 5, 10] };
  }

  const magnitude = 10 ** Math.floor(Math.log10(Math.max(max, 1)));
  const baseSteps = [1, 2, 2.5, 4, 5, 10];
  const candidates = [
    ...baseSteps.map((step) => step * (magnitude / 10)),
    ...baseSteps.map((step) => step * magnitude),
    ...baseSteps.map((step) => step * magnitude * 10),
  ]
    .filter((step) => step > 0 && (max <= 20 ? Number.isInteger(step) : true))
    .sort((a, b) => a - b);

  let step = candidates[candidates.length - 1];
  for (const candidate of candidates) {
    if (Math.ceil(max / candidate) <= 5) {
      step = candidate;
      break;
    }
  }

  const intervals = Math.max(2, Math.ceil(max / step));
  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((index * step).toFixed(2)),
  );

  return { max: ticks[ticks.length - 1], ticks };
}

function slotKey(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * A 96-slot day (15 minute resolution, matching the trend cache). Current
 * readings land in the slot they were taken in; anything the scraper missed
 * stays null so the line only claims what was actually recorded.
 */
function buildTimeline(currentData: Gym[], trendData: TrendSlot[] = []): Point[] {
  const currentBySlot = new Map<string, number>();
  for (const record of currentData) {
    const date = new Date(record.created);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes() - (date.getUTCMinutes() % SLOT_MINUTES);
    // Later readings win, so a slot shows its freshest sample.
    currentBySlot.set(slotKey(hour, minute), record.count);
  }

  const trendBySlot = new Map<string, number>();
  for (const slot of trendData) {
    trendBySlot.set(slot.time, slot.average);
  }

  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const timeline: Point[] = [];
  for (let index = 0; index < SLOTS_PER_DAY; index += 1) {
    const hour = Math.floor((index * SLOT_MINUTES) / 60);
    const minute = (index * SLOT_MINUTES) % 60;
    const key = slotKey(hour, minute);

    const at = new Date(base);
    at.setUTCHours(hour, minute, 0, 0);

    timeline.push({
      key,
      at: at.toISOString(),
      count: currentBySlot.get(key) ?? null,
      average: trendBySlot.get(key) ?? null,
    });
  }

  return timeline;
}

function formatTimeLabel(value: string, withMinutes = false) {
  return new Date(value).toLocaleTimeString("en-AU", {
    hour: "numeric",
    ...(withMinutes ? { minute: "2-digit" } : {}),
    hour12: true,
    timeZone: "UTC",
  });
}

/** Axis labels stay compact: 12am, 6am, 12pm, 6pm. */
function formatHourLabel(value: string) {
  const hour = new Date(value).getUTCHours();
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${hour < 12 ? "am" : "pm"}`;
}

/** Six hour labels on a phone, eight once the card is wide enough. */
function useIsWide() {
  const [isWide, setIsWide] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setIsWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isWide;
}

type ChartProps = {
  data: Gym[];
  trendData?: TrendSlot[];
  description?: string;
  emptyMessage?: string;
  currentCount?: number | null;
  countLabel?: string;
  insight?: string | null;
  live?: boolean;
};

export default function Chart({
  data,
  trendData = [],
  description = "Today's activity vs Average",
  emptyMessage = "No activity data available for this day.",
  currentCount,
  countLabel = "Live Count",
  insight,
  live = true,
}: ChartProps) {
  const chartData = React.useMemo(() => buildTimeline(data, trendData), [data, trendData]);

  const lastRecordedIndex = React.useMemo(() => {
    for (let index = chartData.length - 1; index >= 0; index -= 1) {
      if (typeof chartData[index].count === "number") return index;
    }
    return -1;
  }, [chartData]);

  const lastRecorded = lastRecordedIndex >= 0 ? chartData[lastRecordedIndex] : null;
  // Today's line stops mid-day; a finished day runs to 11:30pm. Only a live day
  // gets a "now" marker, so a past day never claims to be current.
  const isInProgress =
    live && lastRecordedIndex >= 0 && lastRecordedIndex < chartData.length - 1;

  const scale = React.useMemo(
    () => buildScale(chartData.flatMap(({ count, average }) => [count, average])),
    [chartData],
  );

  const isWide = useIsWide();

  const xTicks = React.useMemo(() => {
    const hours = isWide ? [0, 3, 6, 9, 12, 15, 18, 21] : [0, 4, 8, 12, 16, 20];
    return hours
      .map((hour) => chartData[(hour * 60) / SLOT_MINUTES]?.at)
      .filter(Boolean) as string[];
  }, [chartData, isWide]);

  const hasCurrentData = data.length > 0;
  const formattedCurrentCount =
    typeof currentCount === "number"
      ? new Intl.NumberFormat("en-AU").format(currentCount)
      : null;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid flex-1 gap-1 text-left">
            <CardTitle className="text-2xl sm:text-xl">Member Count</CardTitle>
            <CardDescription className="max-w-[28rem] text-sm leading-relaxed">
              {description}
            </CardDescription>
            {insight ? (
              <p className="pt-1 text-sm font-medium text-foreground/90">{insight}</p>
            ) : null}
          </div>
          {formattedCurrentCount ? (
            <div className="hidden rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-left sm:block sm:min-w-[8.5rem] sm:text-right">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
                {countLabel}
              </p>
              <p className="mt-1 text-4xl font-semibold leading-none tracking-tight">
                {formattedCurrentCount}
              </p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
        {hasCurrentData ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[230px] w-full sm:h-[260px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground/70 [&_.recharts-cartesian-axis-tick_text]:text-[11px]"
            >
              <ComposedChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 16, left: 4, right: 16, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="revo-count-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.55} />
                    <stop offset="60%" stopColor="var(--color-count)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.4}
                  strokeDasharray="2 6"
                />

                <XAxis
                  dataKey="at"
                  ticks={xTicks}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => formatHourLabel(value)}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  width={38}
                  ticks={scale.ticks}
                  domain={[0, scale.max]}
                  tickFormatter={(value) => new Intl.NumberFormat("en-AU").format(value)}
                />

                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 4" }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(value) => formatTimeLabel(String(value), true)}
                    />
                  }
                />

                {/* Everything after the last reading is expectation, not fact. */}
                {isInProgress && lastRecorded ? (
                  <ReferenceLine
                    x={lastRecorded.at}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 5"
                    strokeOpacity={0.6}
                  />
                ) : null}

                <Line
                  dataKey="average"
                  type="monotone"
                  name="Average"
                  stroke="var(--color-average)"
                  strokeOpacity={0.42}
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  dot={false}
                  activeDot={{ r: 3, fill: "hsl(var(--muted-foreground))", stroke: "none" }}
                  connectNulls
                  isAnimationActive={false}
                />

                <Area
                  dataKey="count"
                  name="Current"
                  type="monotone"
                  fill="url(#revo-count-fill)"
                  stroke="var(--color-count)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />

                {isInProgress && lastRecorded ? (
                  <ReferenceDot
                    x={lastRecorded.at}
                    y={lastRecorded.count ?? 0}
                    r={4}
                    fill="var(--color-count)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    isFront
                  />
                ) : null}
              </ComposedChart>
            </ChartContainer>

            <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: "hsl(var(--chart-2))" }}
                />
                Current
              </span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-0 w-4 border-t-[1.5px] border-dashed border-muted-foreground/70"
                />
                Average
              </span>
              {isInProgress && lastRecorded ? (
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-0 border-l border-dashed border-border" />
                  Now
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center sm:h-[260px]">
            <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
