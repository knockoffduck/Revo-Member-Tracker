import { AlertTriangle } from "lucide-react";
import type { DataFreshness } from "@/lib/fetchData";

/** "42 minutes ago", "3 hours ago", "yesterday" — used by the banner and cards. */
export function formatFreshnessAge(ageMinutes: number): string {
  if (ageMinutes < 1) return "just now";
  if (ageMinutes < 60) {
    return `${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(ageMinutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * Shown when the newest reading is older than STALE_AFTER_MINUTES. Without it
 * the site keeps saying "live" through an outage, which is how a 38-hour gap
 * went unnoticed.
 */
export default function StaleDataBanner({
  freshness,
  className = "",
}: {
  freshness: DataFreshness;
  className?: string;
}) {
  if (!freshness.stale) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Live counts are paused
          </p>
          <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/80">
            The Revo counter last reported {formatFreshnessAge(freshness.ageMinutes)}.
            What you see is the most recent reading it gave us, not the crowd
            right now.
          </p>
        </div>
      </div>
    </div>
  );
}
