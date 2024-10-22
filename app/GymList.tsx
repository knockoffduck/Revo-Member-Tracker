"use client";
import { Gym, GymResponse } from "./_types";
import { LocationCard } from "./components/LocationCard";

export default async function GymList({
	query,
	gymResponse,
}: {
	query: string;
	gymResponse: GymResponse;
}) {
	const response = gymResponse;

	// Convert ISO string to the local time (using browser's local timezone)
	const convertToLocalTime = (isoString: string): string => {
		const date = new Date(isoString);

		// Format the date to the local timezone (browser's timezone)
		const localTimeFormatter = new Intl.DateTimeFormat("en-US", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false, // 24-hour format
		});

		return localTimeFormatter.format(date);
	};

	// Get the latest time in local timezone
	const latestTime = convertToLocalTime(response.timestamp);
	const gyms = response.data;

	const filteredGyms = Array.isArray(gyms)
		? gyms.filter((gym: Gym) => {
				return gym.name.toLowerCase().includes(query.toLowerCase());
		  })
		: [];

	return (
		<div className="flex flex-col gap-6 ">
			<h4 className="text-xl font-normal text-center ">
				Last Fetched: {latestTime}
			</h4>
			{filteredGyms?.map((gym, index) => (
				<LocationCard key={index} gym={gym}></LocationCard>
			))}
		</div>
	);
}
