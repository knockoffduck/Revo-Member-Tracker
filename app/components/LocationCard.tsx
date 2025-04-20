import { Card } from "@/components/ui/card";
import React from "react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

type Gym = {
  id: string;
  created: string;
  count: number;
  ratio: number;
  gymName: string;
  percentage: number | null;
  gymId: string;
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

  // Check if gym.percentage is null or undefined
  if (gym.percentage === null || gym.percentage === undefined) {
    return <div>ERROR...</div>;
  }
  const currentLevel = checkLevel(gym.percentage);
  console.log(gym.gymName, currentLevel);

  return (
    <Link href={`/gyms/${gym.gymName}`}>
      <Card className="flex flex-col items-center border-0 bg-primary/5 justify-between h-52 p-6">
        <h2 className="text-xl">{gym.gymName}</h2>
        <h3 className="text-4xl">{gym.count}</h3>
        <Progress
          value={gym.percentage}
          max={60}
          className={`h-8 rounded-lg`}
          color={currentLevel.colour}
        ></Progress>
      </Card>
    </Link>
  );
};
