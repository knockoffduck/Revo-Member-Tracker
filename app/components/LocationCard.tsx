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
	const levels = {
		low: { percentage: 12.5, colour: "bg-green-600" },
		medium: { percentage: 25, colour: "bg-yellow-600" },
		high: { percentage: 37.5, colour: "bg-orange-600" },
		full: { percentage: 50, colour: "bg-red-600" },
	};

	const checkLevel = (percentage: number) => {
		if (percentage <= levels.low.percentage) {
			return levels.low;
		} else if (percentage <= levels.medium.percentage) {
			return levels.medium;
		} else if (percentage <= levels.high.percentage) {
			return levels.high;
		} else {
			return levels.full;
		}
	};

	const currentLevel = checkLevel(gym.percentage);

	const style = `h-8 rounded-lg ${currentLevel.colour}`;

	console.log(style);

	return (
		<Card className="flex flex-col  items-center justify-between border-black h-52 p-6">
			<h2 className="text-xl">{gym.name}</h2>
			<h3 className="text-4xl">{gym.member_count}</h3>
			<Progress
				value={gym.percentage}
				max={50}
				className={`h-8 rounded-lg`}
				color={currentLevel.colour}
			></Progress>
		</Card>
	);
};
