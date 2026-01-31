import { LocationCardSkeleton } from "@/app/components/LocationCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="w-full px-8 justify-center pt-6 gap-6">
            <div className="bg-background p-4 md:p-8 min-h-screen text-foreground">
                <div className="max-w-7xl mx-auto">

                    {/* Mock Header/Search UI Skeleton to match GymList layout */}
                    <div className="bg-card/80 backdrop-blur-md p-5 rounded-2xl border border-border shadow-2xl space-y-6 mb-8">
                        <div className="flex w-full flex-col md:flex-row gap-4 items-center justify-between">
                            <Skeleton className="h-12 w-full rounded-xl bg-neutral-800" />
                            <Skeleton className="h-10 w-full md:w-40 rounded-full bg-neutral-800" />
                        </div>
                        <div className="h-px bg-border hidden md:block" />
                        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                            <div className="flex gap-2 w-full lg:w-auto">
                                <Skeleton className="h-9 w-24 rounded-md bg-neutral-800" />
                                <Skeleton className="h-9 w-24 rounded-md bg-neutral-800" />
                                <Skeleton className="h-9 w-24 rounded-md bg-neutral-800" />
                            </div>
                            <div className="flex gap-4 flex-grow">
                                <Skeleton className="h-9 w-full rounded-lg bg-neutral-800" />
                                <Skeleton className="h-9 w-full rounded-lg bg-neutral-800" />
                            </div>
                        </div>
                    </div>

                    {/* Grid of Card Skeletons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center justify-items-center">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <LocationCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
