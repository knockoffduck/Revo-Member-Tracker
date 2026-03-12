import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import type { TrendSlot } from "@/lib/fetchData";

dayjs.extend(utc);
dayjs.extend(timezone);

export type TrendInsight = "below average" | "around average" | "above average";

export const getCurrentTrendSlot = (
    trendData: TrendSlot[],
    gymTimezone: string,
    referenceTime = dayjs(),
) => {
    const nowInGymTz = referenceTime.tz(gymTimezone);
    const roundedMinutes = nowInGymTz.minute() < 30 ? "00" : "30";
    const slotTime = `${nowInGymTz.format("HH")}:${roundedMinutes}`;

    return trendData.find((slot) => slot.time === slotTime) ?? null;
};

export const getTrendInsight = ({
    currentCount,
    trendData,
    gymTimezone,
    referenceTime,
}: {
    currentCount: number | null;
    trendData: TrendSlot[];
    gymTimezone: string;
    referenceTime?: dayjs.Dayjs;
}): TrendInsight | null => {
    if (currentCount === null) {
        return null;
    }

    const currentSlot = getCurrentTrendSlot(trendData, gymTimezone, referenceTime);

    if (!currentSlot) {
        return null;
    }

    const tolerance = Math.max(2, Math.ceil(currentSlot.average * 0.1));

    if (currentCount < currentSlot.average - tolerance) {
        return "below average";
    }

    if (currentCount > currentSlot.average + tolerance) {
        return "above average";
    }

    return "around average";
};
