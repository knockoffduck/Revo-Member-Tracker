import { LocationCard } from "./components/LocationCard";

export default async function Home() {
	type Gym = {
		name: string;
		size: number;
		member_count: number;
		member_ratio: number;
		percentage: number;
	};

	const response = await fetch(
		"https://revotracker.daffydvck.live/api/gyms/stats/latest",
		{
			method: "GET",
			cache: "no-store", // Disable cache
		}
	);

	const result = await response.json();

	const gyms: Gym[] = result.data.data;

	const convertToPerthTime = (isoString: string): string => {
		const date = new Date(isoString);

		// Format the date to Perth time (UTC+8)
		const perthTimeFormatter = new Intl.DateTimeFormat("en-AU", {
			timeZone: "Australia/Perth", // Convert to Perth timezone
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false, // 24-hour format
		});

		return perthTimeFormatter.format(date);
	};

	const latestTime = convertToPerthTime(result.data.timestamp);

	return (
		<div className="grid w-screen h-screen px-8 justify-center pt-6 gap-6">
			<h1 className="text-3xl font-bold">Revo Member Tracker</h1>
			<h4 className="text-xl font-normal text-center">{latestTime}</h4>
			{gyms.map((gym, index) => (
				<LocationCard key={index} gym={gym}></LocationCard>
			))}
		</div>
	);
}
