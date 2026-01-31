import { cn } from "@/lib/utils";

interface CrowdLevelBadgeProps {
    percentage: number;
    size?: "sm" | "default";
}

export default function CrowdLevelBadge({ percentage, size = "default" }: CrowdLevelBadgeProps) {
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

    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-[10px]"
        : "px-3 py-1 text-xs";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium",
                sizeClasses,
                colorClasses
            )}
        >
            {label} ({Math.round(percentage)}%)
        </span>
    );
}

