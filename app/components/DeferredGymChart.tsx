"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Gym } from "../gyms/_types";
import type { TrendSlot } from "@/lib/fetchData";

const Chart = dynamic(() => import("@/app/components/Chart"), {
  ssr: false,
  loading: () => (
    <Card className="w-full">
      <CardHeader className="gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-2 text-left">
          <Skeleton className="h-6 w-36 bg-primary/20" />
          <Skeleton className="h-4 w-56 bg-primary/20" />
          <Skeleton className="h-4 w-40 bg-primary/20" />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
        <Skeleton className="h-[220px] w-full bg-primary/20 sm:h-[250px]" />
      </CardContent>
    </Card>
  ),
});

type DeferredGymChartProps = {
  data: Gym[];
  trendData?: TrendSlot[];
  description?: string;
  emptyMessage?: string;
  currentCount?: number | null;
  insight?: string | null;
};

export default function DeferredGymChart(props: DeferredGymChartProps) {
  return <Chart {...props} />;
}
