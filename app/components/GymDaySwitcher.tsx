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
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/80 px-4 py-4 sm:flex-row sm:justify-between">
      <Link
        href={buildHref(previousDate)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full sm:w-auto",
        )}
      >
        <ChevronLeft className=" h-4 w-4" />
      </Link>

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          {selectedDay.format("ddd, D MMM YYYY")}
        </p>
        <p className="text-xs text-muted-foreground">
          Times shown in {timezone}
        </p>
      </div>

      <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
        <Link
          href={`/gyms/${encodeURIComponent(gymName)}`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "flex-1 sm:flex-none",
            isToday && "pointer-events-none opacity-50",
          )}
          aria-disabled={isToday}
          tabIndex={isToday ? -1 : undefined}
        >
          Today
        </Link>
        <Link
          href={buildHref(nextDate)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "flex-1 sm:flex-none",
            isToday && "pointer-events-none opacity-50",
          )}
          aria-disabled={isToday}
          tabIndex={isToday ? -1 : undefined}
        >
          <ChevronRight className=" h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
