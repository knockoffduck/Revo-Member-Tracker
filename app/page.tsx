import { LocationCard } from "./components/LocationCard";

export default async function Home() {
	type Gym = {
		name: string;
		size: number;
		member_count: number;
		member_ratio: number;
		percentage: number;
	};

	let response = await fetch(
		"https://revotracker.daffydvck.live/api/gyms/stats/latest"
	);

	let result = await response.json();

	let gyms: Gym[] = result.data.data;

	return (
		<div className="grid w-screen h-screen px-8 justify-center pt-6 gap-6">
			<h1 className="text-3xl font-bold">Revo Member Tracker</h1>
			{gyms.map((gym, index) => (
				<LocationCard key={index} gym={gym}></LocationCard>
			))}
		</div>
	);
}
