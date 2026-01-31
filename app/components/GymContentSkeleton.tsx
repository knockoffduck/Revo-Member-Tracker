import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GymContentSkeleton() {
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Badge Skeleton (centered to match previous layout) */}
            <div className="flex justify-center mb-4">
                <Skeleton className="h-6 w-24 rounded-full bg-primary/20" />
            </div>

            {/* Gym Info Card Skeleton */}
            <Card className="mt-4">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 bg-primary/20" />
                            <Skeleton className="h-4 w-64 bg-primary/20" /> {/* Address */}
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 bg-primary/20" />
                            <Skeleton className="h-4 w-32 bg-primary/20" /> {/* Size */}
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full sm:w-32 bg-primary/20" /> {/* Button */}
                </CardContent>
            </Card>

            {/* Chart Skeleton */}
            <div className="mt-8">
                <Card className="w-full">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1 text-center sm:text-left">
                            <Skeleton className="h-6 w-32 bg-primary/20" />
                            <Skeleton className="h-4 w-48 bg-primary/20" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        <Skeleton className="h-[250px] w-full bg-primary/20" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
