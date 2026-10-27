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

  const arrowClass = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "h-11 w-11 shrink-0 rounded-lg border-border/70 bg-background p-0",
  );

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-2 py-2">
      <Link
        href={buildHref(previousDate)}
        scroll={false}
        className={arrowClass}
        aria-label={`View ${selectedDay.subtract(1, "day").format("D MMMM YYYY")}`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Link>

      <div className="min-w-0 text-center">
        <p className="truncate text-sm font-semibold text-foreground">
          {isToday ? "Today" : selectedDay.format("ddd, D MMM YYYY")}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {isToday ? `${selectedDay.format("D MMM YYYY")} · times in ${timezone}` : `Times in ${timezone}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {!isToday ? (
          <Link
            href={`/gyms/${encodeURIComponent(gymName)}`}
            scroll={false}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "h-11 rounded-lg px-3 text-sm font-medium",
            )}
          >
            Today
          </Link>
        ) : null}
        <Link
          href={buildHref(nextDate)}
          scroll={false}
          className={cn(arrowClass, isToday && "pointer-events-none opacity-40")}
          aria-disabled={isToday}
          tabIndex={isToday ? -1 : undefined}
          aria-label={`View ${selectedDay.add(1, "day").format("D MMMM YYYY")}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
