import Link from "next/link";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GymDaySwitcherProps = {
  gymName: string;
  selectedDate: string;
  todayDate: string;
  timezone: string;
};

export default function GymDaySwitcher({
  gymName,
  selectedDate,
  todayDate,
  timezone,
}: GymDaySwitcherProps) {
  const selectedDay = dayjs(`${selectedDate}T00:00:00`);
  const previousDate = selectedDay.subtract(1, "day").format("YYYY-MM-DD");
  const nextDate = selectedDay.add(1, "day").format("YYYY-MM-DD");
  const isToday = selectedDate === todayDate;

  const buildHref = (date: string) =>
    `/gyms/${encodeURIComponent(gymName)}?date=${date}`;

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-3 sm:px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          {selectedDay.format("ddd, D MMM YYYY")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Times shown in {timezone}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-[auto,1fr,auto] items-center gap-2 rounded-xl bg-muted/20 p-1 sm:mx-auto sm:max-w-md">
        <Link
          href={buildHref(previousDate)}
          scroll={false}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 min-w-10 rounded-lg border-border/70 bg-background/80 px-3",
          )}
          aria-label={`View ${selectedDay.subtract(1, "day").format("D MMM YYYY")}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={`/gyms/${encodeURIComponent(gymName)}`}
          scroll={false}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "h-10 w-full rounded-lg bg-background/60 text-sm font-medium shadow-none",
            isToday && "pointer-events-none opacity-50",
          )}
          aria-disabled={isToday}
          tabIndex={isToday ? -1 : undefined}
        >
          Today
        </Link>
        <Link
          href={buildHref(nextDate)}
          scroll={false}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 min-w-10 rounded-lg border-border/70 bg-background/80 px-3",
            isToday && "pointer-events-none opacity-50",
          )}
          aria-disabled={isToday}
          tabIndex={isToday ? -1 : undefined}
          aria-label={`View ${selectedDay.add(1, "day").format("D MMM YYYY")}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
