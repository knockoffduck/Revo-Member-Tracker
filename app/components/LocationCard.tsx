import { Card } from "@/components/ui/card";
import React from "react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import moment from "moment-timezone";

type Gym = {
  id: string;
  created: string;
  count: number;
  ratio: number;
  gymName: string;
  percentage: number | null;
  gymId: string;
  areaSize: number;
  state: string;
};

export const LocationCard = ({ gym }: { gym: Gym }) => {
  const checkLevel = (percentage: number) => {
    if (percentage < 30) {
      return { colour: "bg-green-600" };
    } else if (percentage <= 70) {
      return { colour: "bg-yellow-600" };
    } else {
      return { colour: "bg-red-600" };
    }
  };

  const convertToLocalTime = (dateString: string): string => {
    const utcMoment = moment.utc(dateString);
    const localMoment = utcMoment.local();
    return localMoment.format("h:mm A");
  };

  // Check if gym.percentage is null or undefined
  if (gym.percentage === null || gym.percentage === undefined) {
    return <div>ERROR...</div>;
  }
  const currentLevel = checkLevel(gym.percentage);

  return (
    <Link href={`/gyms/${gym.gymName}`}>
      <Card className="flex flex-col items-center border-0 bg-primary/5 justify-between h-52 p-6">
        <h2 className="text-xl">{gym.gymName}</h2>
        <h3 className="text-4xl">{gym.count}</h3>
        <Progress
          value={gym.percentage}
          max={100}
          className={`h-8 rounded-lg`}
          color={currentLevel.colour}
        ></Progress>
        <div className="flex w-full justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Size: {gym.areaSize}m²
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {convertToLocalTime(gym.created)}
          </p>
        </div>
      </Card>
    </Link>
  );
};

