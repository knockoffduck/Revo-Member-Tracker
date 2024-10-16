import { Card } from "@/components/ui/card";
import React from "react";
import { Progress } from "@/components/ui/progress";

interface Gym {
	GymName: string;
	Size: number;
	LiveMemberCount: number;
	MemberAreaRatio: number;
	Percentage: number;
}

const style = {
	top: "50%",
	right: 0,
	transform: "translate(0, -50%)",
	lineHeight: "24px",
};

export const LocationCard = ({ gym }: { gym: Gym }) => {
	return (
		<Card className="flex flex-col  items-center justify-between border-black h-52 p-6">
			<h2 className="text-xl">{gym.GymName}</h2>
			<h3 className="text-4xl">{gym.LiveMemberCount}</h3>
			<Progress
				value={gym.Percentage}
				max={50}
				className="h-8 rounded-lg"
			></Progress>
		</Card>
	);
};
