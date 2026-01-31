"use client";

import { Gym, GymResponse } from "./_types";
import { LocationCard } from "@/app/components/LocationCard";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  Users,
  Maximize2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFavorites } from "./useFavorites";

/**
 * Displays a list of gyms, allowing filtering and toggling between preferred/all gyms.
 *
 * @param props - Component props.
 * @param props.query - The search query string for filtering gyms by name.
 * @param props.gymResponse - The initial gym data fetched server-side.
 * @param props.currentTime - The timestamp string for the fetched data.
 * @param props.hasGymPreferences - Boolean indicating if the logged-in user has preferences set.
 * @param props.userFavorites - Array of gym names favorited by the user (if logged in).
 * @param props.isAuthenticated - Boolean indicating if the user is logged in.
 */
export default function GymList({
  query,
  gymResponse,
  currentTime,
  hasGymPreferences,
  userFavorites = [],
  isAuthenticated,
}: {
  query: string;
  gymResponse: GymResponse;
  currentTime: string;
  hasGymPreferences: boolean;
  userFavorites?: string[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for columns configuration
  const [columns, setColumns] = useState<number | 'auto'>('auto');
  const [maxColumns, setMaxColumns] = useState(4);
  const [localSearchQuery, setLocalSearchQuery] = useState(query);

  // Local state for favorites filtering (when not using server-side filtering)
  const [showFavoritesLocal, setShowFavoritesLocal] = useState(false);

  const { favorites, isFavorite, toggleFavorite } = useFavorites({
    initialFavorites: userFavorites || [],
    isAuthenticated: isAuthenticated
  });

  // Sync local search query with prop query only on mount or if needed.
  // We REMOVED the auto-sync effect to prevent "glitchy" typing where the server prop (laggy) overwrites the local input.
  // The local state is the source of truth for the input.

  // Monitor screen width to limit column selection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newMax = 4;
      if (width < 640) newMax = 1;      // Mobile
      else if (width < 1024) newMax = 2; // Tablet
      else if (width < 1280) newMax = 3; // Laptop

      setMaxColumns(newMax);

      // Reset to auto if current selection is invalid for new size
      if (typeof columns === 'number' && columns > newMax) {
        setColumns('auto');
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  // Derive state from URL params
  const sortKey = (searchParams.get("sort") as "gymName" | "percentage" | "areaSize") || "percentage";
  const sortDirection = (searchParams.get("order") as "asc" | "desc") || "asc";
  const showAllParam = searchParams.get("showAll") === "true";
  const selectedState = searchParams.get("state") || "All States";

  // Logic for Show Favorites toggle
  // If `hasGymPreferences`:
  //    Toggle controls `showAll` param.
  //    If showAllParam is TRUE, we are showing ALL gyms (toggle OFF).
  //    If showAllParam is FALSE, we are showing FAVORITES (toggle ON).
  // If `!hasGymPreferences`:
  //    Toggle controls `showFavoritesLocal`.
  //    If showFavoritesLocal is TRUE, we are showing FAVORITES (toggle ON).

  // Let's standardize "isShowingFavorites" boolean for the UI switch
  const isShowingFavorites = hasGymPreferences ? !showAllParam : showFavoritesLocal;

  // Handle toggling favorites
  const handleToggleFavorites = () => {
    const newIsShowingFavorites = !isShowingFavorites;

    if (hasGymPreferences) {
      // Server-side toggle flow
      const params = new URLSearchParams(searchParams.toString());
      if (newIsShowingFavorites) {
        // User wants to see favorites -> remove showAll param (default is favorites when has preferences)
        params.delete("showAll");
      } else {
        // User wants to see all -> add showAll=true
        params.set("showAll", "true");
      }
      router.replace(`?${params.toString()}`, { scroll: false });

      toast({
        title: newIsShowingFavorites ? "Showing your preferred gyms" : "Showing all gyms",
        description: "Updating list...",
      });
    } else {
      // Client-side toggle flow
      setShowFavoritesLocal(newIsShowingFavorites);
      toast({
        title: newIsShowingFavorites ? "Showing your favorites" : "Showing all gyms",
        description: "Updating view...",
      });
    }
  };

  const handleSearchChange = (val: string) => {
    setLocalSearchQuery(val);
  };

  // Debounce URL update for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearchQuery) {
        params.set("query", localSearchQuery);
      } else {
        params.delete("query");
      }

      // Only update if the query param actually changed
      const currentQuery = searchParams.get("query") || "";
      if (currentQuery !== localSearchQuery) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, router, searchParams]);

  const handleSort = (key: "gymName" | "percentage" | "areaSize") => {
    const params = new URLSearchParams(searchParams.toString());
    let newDirection = "asc";

    // Default to desc for numbers, asc for name, if switching to it
    if (key !== sortKey) {
      if (key === 'gymName') newDirection = 'asc';
      else newDirection = 'desc';
    } else {
      // Toggling direction
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }

    params.set("sort", key);
    params.set("order", newDirection);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleStateChange = (state: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (state === "All States") {
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
  // We use `localSearchQuery` for instant feedback on typing
  const processedGyms = useMemo(() => {
    let gyms = Array.isArray(gymResponse.data) ? [...gymResponse.data] : [];

    // Filter by Search Query
    if (localSearchQuery) {
      gyms = gyms.filter((gym: Gym) =>
        gym.gymName.toLowerCase().includes(localSearchQuery.toLowerCase()),
      );
    }

    // Filter by State
    if (selectedState && selectedState !== "All States") {
      gyms = gyms.filter((gym) => gym.state === selectedState);
    }

    // Filter by Local Favorites (if active)
    if (!hasGymPreferences && showFavoritesLocal) {
      gyms = gyms.filter(gym => favorites.includes(gym.gymName));
    }

    return gyms;
  }, [gymResponse.data, localSearchQuery, selectedState, hasGymPreferences, showFavoritesLocal, favorites]);

  const gridClassMap: Record<string | number, string> = {
    'auto': "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  // Helper for Sort Buttons
  const SortButton = ({ label, sortKey: btnKey, icon: Icon }: { label: string, sortKey: "gymName" | "percentage" | "areaSize", icon: React.ElementType }) => {
    const isActive = sortKey === btnKey;
    return (
      <button
        onClick={() => handleSort(btnKey)}
        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md border shadow-sm flex-1 sm:flex-none
          ${isActive
            ? 'bg-primary/10 border-primary/20 text-primary ring-1 ring-primary/20'
            : 'bg-card/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        <Icon size={14} className={isActive ? 'text-primary' : ''} />
        <span className="truncate">{label}</span>
        {isActive && (
          sortDirection === 'asc' ? <ArrowUp size={14} className="shrink-0" /> : <ArrowDown size={14} className="shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-background p-4 md:p-8 min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card/80 backdrop-blur-md p-5 rounded-2xl border border-border shadow-2xl space-y-6 mb-8">

          {/* Top Row: Search and Quick Toggles */}
          <div className="flex w-full flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Find a location..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground shadow-inner"
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Show Favorites Toggle Mobile/Desktop */}
            <div className="flex items-center justify-between w-full md:w-auto gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Show Favourites
                </span>
                <div
                  onClick={handleToggleFavorites}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isShowingFavorites ? 'bg-primary' : 'bg-input'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-xl transition duration-200 ease-in-out ${isShowingFavorites ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="h-px bg-border hidden md:block" />

          {/* Bottom Row: Sort and Selects */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:pr-5 lg:border-r border-border">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 sm:mb-0 sm:mr-1">Sort By</span>
              <div className="flex gap-2 w-full">
                <SortButton label="Name" sortKey="gymName" icon={ArrowUpDown} />
                <SortButton label="Occupancy" sortKey="percentage" icon={Users} />
                <SortButton label="Size" sortKey="areaSize" icon={Maximize2} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow">
              {/* State Filter */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">State</span>
                <div className="relative flex-grow">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-input rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground"
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                  >
                    <option value="All States">All States</option>
                    {uniqueStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              {/* Layout Filter */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Layout</span>
                <div className="relative flex-grow">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-input rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground"
                    value={columns}
                    onChange={(e) => setColumns(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}
                  >
                    <option value="auto">Auto Columns</option>
                    {Array.from({ length: 4 }, (_, i) => i + 1)
                      .filter(num => num <= maxColumns)
                      .map(num => (
                        <option key={num} value={num}>{num} Columns</option>
                      ))
                    }
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Gym List Grid */}
        {processedGyms.length > 0 ? (
          <div className={
            columns === 'auto'
              ? "flex flex-wrap justify-center gap-6"
              : `grid ${gridClassMap[columns]} gap-6 justify-center justify-items-center`
          }>
            {processedGyms.map((gym) => (
              <LocationCard
                key={gym.id}
                gym={gym}
                className={columns !== 'auto' ? "max-w-none" : undefined}
                isFavorite={isFavorite(gym.gymName)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No gyms found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
