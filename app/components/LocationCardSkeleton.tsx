import { Skeleton } from "@/components/ui/skeleton";

export function LocationCardSkeleton() {
    return (
        <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
            {/* Header */}
            <div className="p-5 pb-2 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    {/* Gym Name */}
                    <Skeleton className="h-7 w-40 bg-muted" />
                    {/* Status Dot & Text */}
                    <div className="flex items-center gap-1.5 mt-1">
                        <Skeleton className="h-2.5 w-2.5 rounded-full bg-muted" />
                        <Skeleton className="h-4 w-32 bg-muted" />
                    </div>
                </div>
                {/* Heart Icon */}
                <Skeleton className="h-9 w-9 rounded-full bg-muted" />
            </div>

            {/* Main Stats */}
            <div className="px-5 py-4">
                <div className="flex items-end justify-between mb-2">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-16 bg-muted" />
                        <Skeleton className="h-12 w-24 bg-muted" />
                    </div>
                    {/* Trend Badge */}
                    <Skeleton className="h-8 w-20 rounded-lg bg-muted" />
                </div>

                {/* Progress Bar */}
                <Skeleton className="h-3 w-full rounded-full bg-muted" />

                {/* Capacity Label */}
                <div className="flex justify-between mt-2">
                    <Skeleton className="h-3 w-4 bg-muted" />
                    <Skeleton className="h-3 w-32 bg-muted" />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 bg-muted" />
                    <Skeleton className="h-3 w-12 bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 bg-muted" />
                    <Skeleton className="h-3 w-24 bg-muted" />
                </div>
            </div>
        </div>
    );
}
