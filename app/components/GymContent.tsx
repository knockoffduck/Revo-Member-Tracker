import dayjs from "dayjs";
import {
  getGymMeta,
  getGymLiveSnapshot,
  getGymStats,
  getGymTrend,
  resolveGymDate,
  TrendSlot,
} from "@/lib/fetchData";
import { Gym } from "../gyms/_types";
import Chart from "@/app/components/Chart";
import GymInfoCard from "@/app/components/GymInfoCard";
import CrowdLevelBadge from "@/app/components/CrowdLevelBadge";
import NearbyGymsCard from "@/app/components/NearbyGymsCard";
import GymDaySwitcher from "@/app/components/GymDaySwitcher";
import moment from "moment-timezone";

export default async function GymContent({
  gymName,
  selectedDate,
}: {
  gymName: string;
  selectedDate?: string;
}) {
  const requestStartedAt = performance.now();
  const gymMeta = await getGymMeta(gymName);
  const metaResolvedAt = performance.now();
  const timezone = gymMeta?.timezone || "Australia/Perth";
  const { selectedDay, today } = resolveGymDate(timezone, selectedDate);
  const dateMeta = {
    timezone,
    selectedDate: selectedDay.format("YYYY-MM-DD"),
    todayDate: today,
    isToday: selectedDay.format("YYYY-MM-DD") === today,
  };

  const [data, trendData, liveSnapshot] = await Promise.all([
    getGymStats(gymName, dateMeta.selectedDate, gymMeta ?? undefined),
    gymMeta?.id
      ? getGymTrend(gymMeta.id, gymMeta.timezone)
      : Promise.resolve([] as TrendSlot[]),
    getGymLiveSnapshot(gymName, gymMeta ?? undefined),
  ]);
  const dataResolvedAt = performance.now();

  const currentPercentage = liveSnapshot?.percentage ?? 0;
  const currentMemberCount = liveSnapshot?.count ?? null;

  const localisedData = data.map((item: Gym) => {
    // Convert the database UTC time to the Gym's wall tim
    // We treat this wall time as if it were UTC ("Fake UTC")
    // so that the Chart component (which renders in UTC) displays the correct wall clock time.
    // e.g. 08:00 Adelaide Time -> 08:00 UTC

    const gymWallTime = moment.utc(item.created).tz(item.timezone);
    const fakeUtcString = gymWallTime.format("YYYY-MM-DDTHH:mm:ss") + "Z";

    const localisedItem = {
      ...item,
      created: fakeUtcString,
    };
    return localisedItem;
  });

  const selectedDayLabel = dayjs(`${dateMeta.selectedDate}T00:00:00`).format(
    "MMM D",
  );
  const chartDescription = dateMeta.isToday
    ? "Today's activity vs Average"
    : `Activity for ${selectedDayLabel} vs Average`;

  console.log(
    `[GymContent] ${gymName} (${dateMeta.selectedDate}) meta=${(
      metaResolvedAt - requestStartedAt
    ).toFixed(
      1,
    )}ms data+trend=${(dataResolvedAt - metaResolvedAt).toFixed(1)}ms total=${(
      dataResolvedAt - requestStartedAt
    ).toFixed(1)}ms`,
  );

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex justify-center">
        <CrowdLevelBadge percentage={currentPercentage} />
      </div>

      {gymMeta && (
        <GymInfoCard
          details={{
            address: gymMeta.address,
            postcode: gymMeta.postcode,
            state: gymMeta.state,
            areaSize: gymMeta.areaSize,
            timezone: gymMeta.timezone,
          }}
        />
      )}

      <Chart
        data={localisedData}
        trendData={trendData}
        description={chartDescription}
        emptyMessage={`No member count samples were recorded for ${selectedDayLabel}.`}
        currentCount={currentMemberCount}
      />
      <GymDaySwitcher
        gymName={gymName}
        selectedDate={dateMeta.selectedDate}
        todayDate={dateMeta.todayDate}
        timezone={dateMeta.timezone}
      />

      <NearbyGymsCard gymName={gymName} />
    </div>
  );
}
