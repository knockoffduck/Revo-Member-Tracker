import { authClient } from "@/lib/auth-client";
import { Gym, GymResponse } from "./_types";
import { LocationCard } from "./components/LocationCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Convert ISO string to the local time (using browser's local timezone)
const convertToLocalTime = (isoString: string): string => {
	const date = new Date(isoString);

	// Format the date to the local timezone (browser's timezone)
	const localTimeFormatter = new Intl.DateTimeFormat("en-AU", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true, // 24-hour format
	});

	return localTimeFormatter.format(date);
};

export default async function GymList({
	query,
	gymResponse,
}: {
	query: string;
	gymResponse: GymResponse;
}) {




	// Get the latest time in local timezone
	const latestTime = convertToLocalTime(gymResponse.timestamp);
	const gyms = gymResponse.data;



	const filteredGyms = Array.isArray(gyms)
		? gyms.filter((gym: Gym) => {
			return gym.gymName.toLowerCase().includes(query.toLowerCase());
		})
		: [];

	return (
		<div className="flex flex-col gap-6 py-6">
			<h4 className="text-xl font-normal text-center ">
				Last Fetched: {latestTime}
			</h4>
			{filteredGyms?.map((gym, index) => (
				<LocationCard key={index} gym={gym}></LocationCard>
			))}
		</div>
	);
}
