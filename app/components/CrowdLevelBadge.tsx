import { cn } from "@/lib/utils";

interface CrowdLevelBadgeProps {
    percentage: number;
}

export default function CrowdLevelBadge({ percentage }: CrowdLevelBadgeProps) {
    let label: string;
    let colorClasses: string;

    if (percentage < 30) {
        label = "Quiet";
        colorClasses = "bg-green-500/20 text-green-600 dark:text-green-400";
    } else if (percentage <= 70) {
        label = "Moderate";
        colorClasses = "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    } else {
        label = "Busy";
        colorClasses = "bg-red-500/20 text-red-600 dark:text-red-400";
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                colorClasses
            )}
        >
            {label} ({Math.round(percentage)}%)
        </span>
    );
}
