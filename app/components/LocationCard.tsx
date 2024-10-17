import { Card } from "@/components/ui/card";
import React from "react";
import { Progress } from "@/components/ui/progress";

type Gym = {
	name: string;
	size: number;
	member_count: number;
	member_ratio: number;
	percentage: number;
};

export const LocationCard = ({ gym }: { gym: Gym }) => {
	return (
		<Card className="flex flex-col  items-center justify-between border-black h-52 p-6">
			<h2 className="text-xl">{gym.name}</h2>
			<h3 className="text-4xl">{gym.member_count}</h3>
			<Progress
				value={gym.percentage}
				max={50}
				className="h-8 rounded-lg"
			></Progress>
		</Card>
	);
};
