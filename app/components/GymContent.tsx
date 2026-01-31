import { getGymStats, getGymId, getGymTrend, getGymDetails, TrendSlot } from "@/lib/fetchData";
import { Gym } from "../gyms/_types";
import Chart from "@/app/components/Chart";
import GymInfoCard from "@/app/components/GymInfoCard";
import CrowdLevelBadge from "@/app/components/CrowdLevelBadge";
import moment from "moment-timezone";

export default async function GymContent({ gymName }: { gymName: string }) {
    // Fetch current day data
    const data = await getGymStats(gymName);

    // Fetch trend data
    let trendData: TrendSlot[] = [];
    const gymId = await getGymId(gymName);
    if (gymId) {
        trendData = await getGymTrend(gymId);
    }

    // Fetch gym details for info card
    const gymDetails = await getGymDetails(gymName);

    // Get current percentage from most recent data point
    const currentPercentage = data.length > 0 ? data[data.length - 1].percentage : 0;

    const localisedData = data.map((item: Gym) => {
        // Convert the database UTC time to the Gym's wall tim
        // We treat this wall time as if it were UTC ("Fake UTC") 
        // so that the Chart component (which renders in UTC) displays the correct wall clock time.
        // e.g. 08:00 Adelaide Time -> 08:00 UTC

        const gymWallTime = moment.utc(item.created).tz(item.timezone);
        const fakeUtcString = gymWallTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z';

        const localisedItem = {
            ...item,
            created: fakeUtcString,
        };
        return localisedItem;
    });

    return (
        <div className="flex flex-col w-full gap-4">
            <div className="flex justify-center">
                <CrowdLevelBadge percentage={currentPercentage} />
            </div>

            {gymDetails && <GymInfoCard details={gymDetails} />}

            <Chart data={localisedData} trendData={trendData} />
        </div>
    );
}
