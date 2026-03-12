import { cn } from "@/lib/utils";

interface CrowdLevelBadgeProps {
    percentage: number;
    size?: "sm" | "default";
}

export const getCrowdLevelMeta = (percentage: number) => {
    if (percentage < 30) {
        return {
            label: "Quiet",
            textClasses: "text-green-600 dark:text-green-400",
            colorClasses: "bg-green-500/20 text-green-600 dark:text-green-400",
        };
    }

    if (percentage <= 70) {
        return {
            label: "Moderate",
            textClasses: "text-yellow-600 dark:text-yellow-400",
            colorClasses: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
        };
    }

    return {
        label: "Busy",
        textClasses: "text-red-600 dark:text-red-400",
        colorClasses: "bg-red-500/20 text-red-600 dark:text-red-400",
    };
};

export default function CrowdLevelBadge({ percentage, size = "default" }: CrowdLevelBadgeProps) {
    const { label, colorClasses } = getCrowdLevelMeta(percentage);

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
