"use client";

import moment from "moment-timezone";
import { Switch } from "@/components/ui/switch";
import { Gym, GymResponse } from "./_types";
import { LocationCard } from "@/app/components/LocationCard";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { fetchGyms } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
  currentTime, // Renamed from timestamp in gymResponse for clarity
  hasGymPreferences,
}: {
  query: string;
  gymResponse: GymResponse;
  currentTime: string;
  hasGymPreferences: boolean;
}) {
  // State to hold the gyms currently being displayed (initially from props)
  const [displayedGyms, setDisplayedGyms] = useState<Gym[]>(gymResponse.data);
  // State for the "Show All" toggle (only relevant if user has preferences)
  // Default to false (showing preferred) if preferences exist
  const [showAll, setShowAll] = useState<boolean>(!hasGymPreferences);
  // State to track loading status during client-side fetches
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: "gymName" | "percentage";
    direction: "asc" | "desc";
  } | null>(null);

  /**
   * Converts a date string (assumed UTC) to a locale-specific time string.
   * @param dateString - The ISO date string (e.g., from the database).
   * @returns Formatted time string (e.g., "10:30 PM").
   */
  const convertToLocalTime = (dateString: string): string => {
    // Create Date object (interprets ISO string as UTC)
    const utcMoment = moment.utc(dateString);
    const localMoment = utcMoment.local();
    const result = localMoment.format("h:mm A");
    return result;
  };

  // Format the timestamp passed from the server component

  // Effect to reset displayed gyms if the initial server-fetched data changes
  // This handles cases where the parent component might refetch and pass new props
  useEffect(() => {
    setDisplayedGyms(gymResponse.data);
    // Reset toggle based on new preference status if needed
    setShowAll(!hasGymPreferences);
  }, [gymResponse.data, hasGymPreferences]);

  // Handle toggling between preferred and all gyms
  const handleToggleChange = async (checked: boolean) => {
    setShowAll(checked);
    setIsLoading(true); // Set loading state

    const operation = checked
      ? "Showing all gyms"
      : "Showing your preferred gyms";
    toast({ title: "Updating gym list...", description: operation });

    try {
      if (checked) {
        // Fetch all gyms - assuming fetchGyms action does this when toggled on
        // We might need to pass an indicator to fetchGyms
        // For now, assuming it fetches *all* gyms regardless of FormData content
        // but uses the timestamp to get the latest *set* of data.
        const allGyms = await fetchGyms(true, currentTime); // Pass true to show all gyms
        setDisplayedGyms(allGyms);
      } else {
        // Revert to the initially fetched preferred gyms from props
        setDisplayedGyms(gymResponse.data);
      }
      toast({ title: "Gym list updated!", description: operation });
    } catch (error) {
      console.error("Failed to update gym list:", error);
      toast({
        title: "Error",
        description: "Could not update gym list.",
        variant: "destructive",
      });
      // Optionally revert toggle state on error
      setShowAll(!checked);
    } finally {
      setIsLoading(false); // Clear loading state
    }
  };

  const handleSort = (key: "gymName" | "percentage") => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Filter and sort the displayed gyms
  const processedGyms = useMemo(() => {
    let gyms = Array.isArray(displayedGyms) ? [...displayedGyms] : [];

    // Filter
    if (query) {
      gyms = gyms.filter((gym: Gym) =>
        gym.gymName.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Sort
    if (sortConfig) {
      gyms.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle possible null values for percentage
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return gyms;
  }, [displayedGyms, query, sortConfig]);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Display Timestamp */}


      {/* "Show All" Toggle (only if user has preferences) */}
      {hasGymPreferences && (
        <div className="flex items-center justify-center gap-2">
          <Switch
            id="show-all-switch"
            checked={showAll}
            onCheckedChange={handleToggleChange}
            disabled={isLoading} // Disable while loading
          />
          <Label htmlFor="show-all-switch" className="text-md font-medium">
            Show All Gyms
          </Label>
        </div>
      )}

      {/* Sort Buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={sortConfig?.key === "gymName" ? "default" : "outline"}
          onClick={() => handleSort("gymName")}
          className="w-32"
        >
          Name
          {sortConfig?.key === "gymName" ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
        <Button
          variant={sortConfig?.key === "percentage" ? "default" : "outline"}
          onClick={() => handleSort("percentage")}
          className="w-32"
        >
          Occupancy
          {sortConfig?.key === "percentage" ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Loading Indicator */}
      {isLoading && <p className="text-center">Loading...</p>}

      {/* Gym List */}
      {!isLoading && processedGyms.length > 0 ? (
        processedGyms.map((gym) => <LocationCard key={gym.id} gym={gym} />)
      ) : !isLoading ? (
        // Message when no gyms match the filter or no data
        <p className="text-center text-gray-500">
          {query ? "No gyms match your search." : "No gym data available."}
        </p>
      ) : null}
    </div>
  );
}
