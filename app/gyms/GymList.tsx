"use client";

import { Switch } from "@/components/ui/switch";
import { Gym, GymResponse } from "./_types";
import { LocationCard } from "@/app/components/LocationCard";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Displays a list of gyms, allowing filtering and toggling between preferred/all gyms.
 *
 * @param props - Component props.
 * @param props.query - The search query string for filtering gyms by name.
 * @param props.gymResponse - The initial gym data fetched server-side.
 * @param props.currentTime - The timestamp string for the fetched data.
 * @param props.hasGymPreferences - Boolean indicating if the logged-in user has preferences set.
 */
export default function GymList({
  query,
  gymResponse,
  currentTime,
  hasGymPreferences,
}: {
  query: string;
  gymResponse: GymResponse;
  currentTime: string;
  hasGymPreferences: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive state from URL params
  const sortKey = (searchParams.get("sort") as "gymName" | "percentage" | "areaSize") || "percentage";
  const sortDirection = (searchParams.get("order") as "asc" | "desc") || "asc";
  const showAllParam = searchParams.get("showAll") === "true";
  const selectedState = searchParams.get("state") || "All";

  // If user has no preferences, we always show all (logic handled by server mainly, but UI toggle state respects this)
  // If user has preferences, visual toggle state matches URL param
  const showAll = !hasGymPreferences || showAllParam;

  // Handle toggling between preferred and all gyms
  const handleToggleChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("showAll", "true");
    } else {
      params.delete("showAll");
    }
    router.replace(`?${params.toString()}`, { scroll: false });

    toast({
      title: checked ? "Showing all gyms" : "Showing your preferred gyms",
      description: "Updating list...",
    });
  };

  const handleSort = (key: "gymName" | "percentage" | "areaSize") => {
    const params = new URLSearchParams(searchParams.toString());
    let newDirection = "asc";

    if (sortKey === key && sortDirection === "asc") {
      newDirection = "desc";
    }

    params.set("sort", key);
    params.set("order", newDirection);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleStateChange = (state: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (state === "All") {
      params.delete("state");
    } else {
      params.set("state", state);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Extract unique states for filter dropdown
  const uniqueStates = useMemo(() => {
    const states = gymResponse.data
      .map((gym) => gym.state)
      .filter((state): state is string => !!state); // Filter out null/undefined
    return Array.from(new Set(states)).sort();
  }, [gymResponse.data]);

  // Client-side filtering (Search & State Filter)
  // Sorting is now handled server-side!
  const processedGyms = useMemo(() => {
    let gyms = Array.isArray(gymResponse.data) ? [...gymResponse.data] : [];

    // Filter by Search Query
    if (query) {
      gyms = gyms.filter((gym: Gym) =>
        gym.gymName.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Filter by State
    if (selectedState && selectedState !== "All") {
      gyms = gyms.filter((gym) => gym.state === selectedState);
    }

    return gyms;
  }, [gymResponse.data, query, selectedState]);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* "Show All" Toggle (only if user has preferences) */}
      {hasGymPreferences && (
        <div className="flex items-center justify-center gap-2">
          <Switch
            id="show-all-switch"
            checked={showAll}
            onCheckedChange={handleToggleChange}
          />
          <Label htmlFor="show-all-switch" className="text-md font-medium">
            Show All Gyms
          </Label>
        </div>
      )}

      {/* Controls: Sort and Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        {/* Sort Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant={sortKey === "gymName" ? "default" : "outline"}
            onClick={() => handleSort("gymName")}
            className="w-28"
            size="sm"
          >
            Name
            {sortKey === "gymName" ? (
              sortDirection === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Button
            variant={sortKey === "percentage" ? "default" : "outline"}
            onClick={() => handleSort("percentage")}
            className="w-28"
            size="sm"
          >
            Occupancy
            {sortKey === "percentage" ? (
              sortDirection === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Button
            variant={sortKey === "areaSize" ? "default" : "outline"}
            onClick={() => handleSort("areaSize")}
            className="w-28"
            size="sm"
          >
            Size
            {sortKey === "areaSize" ? (
              sortDirection === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="state-filter" className="whitespace-nowrap font-medium">State:</Label>
          <select
            id="state-filter"
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="All">All States</option>
            {uniqueStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gym List */}
      {processedGyms.length > 0 ? (
        processedGyms.map((gym) => <LocationCard key={gym.id} gym={gym} />)
      ) : (
        // Message when no gyms match the filter or no data
        <p className="text-center text-gray-500">
          {query || selectedState !== "All" ? "No gyms match your filters." : "No gym data available."}
        </p>
      )}
    </div>
  );
}
