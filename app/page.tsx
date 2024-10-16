import { LocationCard } from "./components/LocationCard";

export default function Home() {
	const gyms = [
		{
			GymName: "Balcatta",
			Size: 1180,
			LiveMemberCount: 3,
			MemberAreaRatio: 393.3333333333333,
			Percentage: 5,
		},
		{
			GymName: "Banksia Grove",
			Size: 1100,
			LiveMemberCount: 1,
			MemberAreaRatio: 1100,
			Percentage: 0,
		},
		{
			GymName: "Belmont",
			Size: 1050,
			LiveMemberCount: 5,
			MemberAreaRatio: 210,
			Percentage: 0,
		},
		{
			GymName: "Canning Vale",
			Size: 2000,
			LiveMemberCount: 7,
			MemberAreaRatio: 285.7142857142857,
			Percentage: 0,
		},
	];

	return (
		<div className="grid w-screen h-screen px-8 justify-center pt-6 ">
			<h1 className="text-3xl font-bold">Revo Member Tracker</h1>
			{gyms.map((gym, index) => (
				<LocationCard key={index} gym={gym}></LocationCard>
			))}
		</div>
	);
}
