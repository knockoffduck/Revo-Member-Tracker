import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeleton() {
  return (
    <div className="flex w-full px-8 justify-center pt-6 ">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Gym Preferences</CardTitle>
          <CardDescription>
            Select the gyms you would like to be displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-10 w-52 rounded-xl"></Skeleton>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-8 rounded-xl"></Skeleton>
            <Skeleton className="h-6 w-32 rounded-xl"></Skeleton>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-8 rounded-xl"></Skeleton>
            <Skeleton className="h-6 w-32 rounded-xl"></Skeleton>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-8 rounded-xl"></Skeleton>
            <Skeleton className="h-6 w-32 rounded-xl"></Skeleton>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-8 rounded-xl"></Skeleton>
            <Skeleton className="h-6 w-32 rounded-xl"></Skeleton>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-8 rounded-xl"></Skeleton>
            <Skeleton className="h-6 w-32 rounded-xl"></Skeleton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
