"use client";

import { useEffect, useState } from "react";
import { Heart, Clock, MapPin, ArrowUpRight, Dumbbell } from 'lucide-react';
import Link from "next/link";
import { getCrowdLevelMeta } from "@/app/components/CrowdLevelBadge";

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
  squatRacks: number;
};

interface LocationCardProps {
  gym: Gym;
  className?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (gymName: string) => void;
  /** True when the newest reading is old: stop saying "now". */
  stale?: boolean;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const parseUtcDateString = (dateString: string): Date => {
  const normalizedDateString = dateString.includes("T")
    ? dateString
    : dateString.replace(" ", "T");
  const utcDateString =
    /[zZ]|[+-]\d{2}:\d{2}$/.test(normalizedDateString)
      ? normalizedDateString
      : `${normalizedDateString}Z`;

  return new Date(utcDateString);
};

/** "3 min ago" reads better than a bare clock time that could be any day. */
function relativeTime(from: Date, now: number) {
  const seconds = Math.max(0, Math.round((now - from.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export const LocationCard: React.FC<LocationCardProps> = ({ gym, className, isFavorite = false, onToggleFavorite, stale = false }) => {

  const {
    gymName: name,
    count,
    areaSize: size,
    created,
    percentage: rawPercentage,
    squatRacks
  } = gym;

  const percentage = rawPercentage ?? 0;
  const parsedCreated = parseUtcDateString(created);
  const [now, setNow] = useState(() => Date.now());

  // Keeps "Updated 2 min ago" honest without re-fetching anything.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const absoluteUpdated = Number.isNaN(parsedCreated.getTime())
    ? ""
    : timeFormatter.format(parsedCreated);
  const relativeUpdated = Number.isNaN(parsedCreated.getTime())
    ? ""
    : relativeTime(parsedCreated, now);

  // One crowd vocabulary for the whole app (see CrowdLevelBadge).
  const crowd = getCrowdLevelMeta(percentage);
  const barColor =
    percentage > 70 ? "bg-red-500" : percentage > 30 ? "bg-amber-500" : "bg-emerald-500";

  const estimatedCapacity = Math.floor(size / 5);
  const squatRank = squatRacks > 0 ? Math.max(1, Math.round((count / squatRacks) * 10) / 10) : 0;
  const squatStatusColor =
    squatRank > 12 ? "text-red-700 dark:text-red-400" : squatRank > 6 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400";

  return (
    <Link href={`/gyms/${name}`} className={`block w-full max-w-sm group ${className || ''}`}>
      <div className="w-full bg-card border border-border rounded-xl overflow-hidden transition-colors hover:border-muted-foreground/40">

        {/* --- HEADER --- */}
        <div className="p-5 pb-2 flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <span className="truncate">{name}</span>
              <ArrowUpRight className="w-4 h-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${percentage > 70 ? "bg-red-500" : percentage > 30 ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className={`text-sm font-medium ${crowd.textClasses}`}>
                {crowd.label} &bull; {Math.round(percentage)}% full
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(name);
            }}
            aria-label={isFavorite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
            aria-pressed={isFavorite}
            className={`-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isFavorite ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* --- MAIN STAT --- */}
        <div className="px-5 pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-card-foreground tracking-tight tabular-nums">
                {count}
              </span>
              <span className="text-sm text-muted-foreground">
                member{count === 1 ? "" : "s"} {stale ? "at last update" : "now"}
              </span>
            </div>
          </div>

          <div className="relative mt-3 w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(percentage)}% of ~{estimatedCapacity} capacity</span>
          </div>
        </div>

        {/* --- SQUAT RACKS --- */}
        {squatRacks > 0 && (
          <div className="bg-muted/30 border-t border-border px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <Dumbbell className={`w-4 h-4 ${squatStatusColor}`} aria-hidden="true" />
              <span className="whitespace-nowrap text-sm text-card-foreground">
                {squatRacks} rack{squatRacks === 1 ? "" : "s"}
              </span>
            </div>
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              ~{Math.max(1, Math.round(squatRank))} per rack
            </span>
          </div>
        )}

        {/* --- FOOTER --- */}
        <div className="bg-muted/50 border-t border-border px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5" title="Gym floor size">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{size}m²</span>
          </div>

          <div className="flex items-center gap-1.5" title={absoluteUpdated ? `Updated at ${absoluteUpdated}` : undefined}>
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Updated {relativeUpdated}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
