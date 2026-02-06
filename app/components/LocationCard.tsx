import React, { useState } from 'react';
import { Heart, Clock, MapPin, ArrowUpRight, Dumbbell } from 'lucide-react';
import Link from "next/link";
import moment from "moment-timezone";

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
}

export const LocationCard: React.FC<LocationCardProps> = ({ gym, className, isFavorite = false, onToggleFavorite }) => {

  const {
    gymName: name,
    count,
    areaSize: size,
    created,
    percentage: rawPercentage,
    squatRacks
  } = gym;

  // Internal state removed in favor of controlled props


  const percentage = rawPercentage ?? 0;

  // Format last updated time
  const convertToLocalTime = (dateString: string): string => {
    const utcMoment = moment.utc(dateString);
    const localMoment = utcMoment.local();
    return localMoment.format("h:mm A");
  };

  const lastUpdated = convertToLocalTime(created);

  // Determine Status Color & Label using the provided logic
  // Note: Previous logic was <30 green, <=70 yellow, >70 red.
  // New logic from prompt: >40 && <=75 amber, >75 red, else emerald.
  // I will stick to the new design's logic.

  let statusColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  let statusLabel = "Quiet";
  let barColor = "bg-emerald-500";

  // Using the logic provided in the prompt
  if (percentage > 40 && percentage <= 75) {
    statusColor = "bg-amber-500";
    textColor = "text-amber-400";
    statusLabel = "Moderate";
    barColor = "bg-amber-500";
  } else if (percentage > 75) {
    statusColor = "bg-red-500";
    textColor = "text-red-400";
    statusLabel = "Busy";
    barColor = "bg-red-500";
  }

  // Estimated capacity calculation from prompt logic (mock)
  // Logic: const estimatedCapacity = Math.floor(size / 5);
  // Actually, size is areaSize. The prompt uses size / 5.
  const estimatedCapacity = Math.floor(size / 5);

  // Calculate N Squat Rank (people per squat rack)
  const squatRank = squatRacks > 0 ? Math.round((count / squatRacks) * 10) / 10 : 0;
  
  // Determine squat rack crowdedness
  // Assuming ~25% of gym users actually use squat racks
  let squatStatusColor = "text-emerald-400";
  let squatStatusLabel = "Available";
  
  if (squatRacks > 0) {
    if (squatRank > 6 && squatRank <= 12) {
      squatStatusColor = "text-amber-400";
      squatStatusLabel = "Getting Busy";
    } else if (squatRank > 12) {
      squatStatusColor = "text-red-400";
      squatStatusLabel = "Crowded";
    }
  }

  return (
    <Link href={`/gyms/${name}`} className={`block w-full max-w-sm group ${className || ''}`}>
      <div
        className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-muted-foreground/50 transition-all duration-300 relative"
      >

        {/* --- HEADER --- */}
        <div className="p-5 pb-2 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              {name}
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300" />
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColor}`}></span>
              </span>
              <span className={`text-sm font-medium ${textColor}`}>
                {statusLabel} &bull; {Math.round(percentage)}% Full
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation when clicking heart
              e.stopPropagation();
              onToggleFavorite?.(name);
            }}
            className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* --- MAIN STATS --- */}
        <div className="px-5 py-4">
          <div className="flex items-end justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Live Count</span>
              <div className="text-5xl font-bold text-card-foreground tracking-tight tabular-nums">
                {count}
              </div>
            </div>

          </div>

          {/* --- PROGRESS BAR --- */}
          <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]"></div>

            <div
              className={`h-full ${barColor} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Capacity Label */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            <span>Est. Capacity: ~{estimatedCapacity}</span>
          </div>
        </div>

        {/* --- SQUAT RACK STATUS --- */}
        {squatRacks > 0 && (
          <div className="bg-muted/30 border-t border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <Dumbbell className={`w-4 h-4 ${squatStatusColor}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-card-foreground">Squat Racks</span>
                <span className="text-xs text-muted-foreground">{squatRacks} racks</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-card-foreground">~{Math.round(squatRank)}</span>
              <span className="text-xs text-muted-foreground ml-1">people per rack</span>
            </div>
          </div>
        )}

        {/* --- FOOTER / METADATA --- */}
        <div className="bg-muted/50 border-t border-border p-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5" title="Gym Floor Size">
            <MapPin className="w-3.5 h-3.5" />
            <span>{size}m²</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {lastUpdated}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
