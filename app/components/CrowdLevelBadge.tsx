import { cn } from "@/lib/utils";

interface CrowdLevelBadgeProps {
    percentage: number;
    size?: "sm" | "default";
}

export const getCrowdLevelMeta = (percentage: number) => {
    // 700-level colours in light mode: 500/600 sit at 2.9 to 3.8:1 on white,
    // which fails WCAG AA for this text size. Dark mode keeps the 400s.
    if (percentage < 30) {
        return {
            label: "Quiet",
            textClasses: "text-green-700 dark:text-green-400",
            colorClasses: "bg-green-500/15 text-green-700 dark:text-green-400",
        };
    }

    if (percentage <= 70) {
        return {
            label: "Moderate",
            textClasses: "text-yellow-700 dark:text-yellow-400",
            colorClasses: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        };
    }

    return {
        label: "Busy",
        textClasses: "text-red-700 dark:text-red-400",
        colorClasses: "bg-red-500/15 text-red-700 dark:text-red-400",
    };
};

export default function CrowdLevelBadge({ percentage, size = "default" }: CrowdLevelBadgeProps) {
    const { label, colorClasses } = getCrowdLevelMeta(percentage);

    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
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
