"use client";

import { Gym, GymResponse, SortKey, SORT_OPTIONS, getSortLabel } from "./_types";
import { LocationCard } from "@/app/components/LocationCard";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFavorites } from "./useFavorites";

type SortDropdownProps = {
  label: string;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  isOpen: boolean;
  onToggle: () => void;
  onSort: (key: SortKey) => void;
  onToggleDirection: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
};

function SortDropdown({
  label,
  sortKey,
  sortDirection,
  isOpen,
  onToggle,
  onSort,
  onToggleDirection,
  containerRef,
}: SortDropdownProps) {
  const sections = [
    { title: "Occupancy", options: SORT_OPTIONS.filter((opt) => opt.section === "occupancy") },
    { title: "Facilities", options: SORT_OPTIONS.filter((opt) => opt.section === "facilities") },
    { title: "General", options: SORT_OPTIONS.filter((opt) => opt.section === "general") },
  ].filter((section) => section.options.length > 0);

  return (
    <div className="flex items-center gap-1.5" ref={containerRef}>
      <div className="relative flex-1 sm:flex-none">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 sm:min-w-[11rem]"
        >
          <span className="truncate">{label}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-[60] mt-2 min-w-[13rem] rounded-xl border border-border bg-popover py-2 text-popover-foreground shadow-lg"
          >
            {sections.map((section, index) => (
              <div key={section.title}>
                {index > 0 ? <div className="mx-3 my-2 h-px bg-border" /> : null}
                <div className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </div>
                {section.options.map((option) => (
                  <button
                    key={option.key}
                    role="menuitemradio"
                    aria-checked={sortKey === option.key}
                    onClick={() => onSort(option.key)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                      sortKey === option.key
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortKey === option.key
                      ? sortDirection === "asc"
                        ? <ArrowUp size={14} aria-hidden="true" />
                        : <ArrowDown size={14} aria-hidden="true" />
                      : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleDirection}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background transition-colors hover:bg-muted/50"
        aria-label={sortDirection === "asc" ? "Sort descending" : "Sort ascending"}
        title={sortDirection === "asc" ? "Switch to descending" : "Switch to ascending"}
      >
        {sortDirection === "asc"
          ? <ArrowUp size={16} className="text-muted-foreground" aria-hidden="true" />
          : <ArrowDown size={16} className="text-muted-foreground" aria-hidden="true" />}
      </button>
    </div>
  );
}

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

  const [columns, setColumns] = useState<number | "auto">("auto");
  const [maxColumns, setMaxColumns] = useState(4);
  const [localSearchQuery, setLocalSearchQuery] = useState(query);
  const [showFavoritesLocal, setShowFavoritesLocal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { favorites, isFavorite, toggleFavorite } = useFavorites({
    initialFavorites: userFavorites || [],
    isAuthenticated,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newMax = 4;
      if (width < 640) newMax = 1;
      else if (width < 1024) newMax = 2;
      else if (width < 1280) newMax = 3;

      setMaxColumns(newMax);
      if (typeof columns === "number" && columns > newMax) {
        setColumns("auto");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columns]);

  const sortKey = (searchParams.get("sort") as SortKey) || "percentage";
  const sortDirection = (searchParams.get("order") as "asc" | "desc") || "desc";
  const showAllParam = searchParams.get("showAll") === "true";
  const selectedState = searchParams.get("state") || "All States";

  const isShowingFavorites = hasGymPreferences ? !showAllParam : showFavoritesLocal;
  const activeFilterCount =
    (selectedState !== "All States" ? 1 : 0) + (isShowingFavorites ? 1 : 0);

  const handleToggleFavorites = () => {
    const newIsShowingFavorites = !isShowingFavorites;

    if (hasGymPreferences) {
      const params = new URLSearchParams(searchParams.toString());
      if (newIsShowingFavorites) {
        params.delete("showAll");
      } else {
        params.set("showAll", "true");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
      toast({
        title: newIsShowingFavorites ? "Showing your preferred gyms" : "Showing all gyms",
        description: "Updating list...",
      });
    } else {
      setShowFavoritesLocal(newIsShowingFavorites);
      toast({
        title: newIsShowingFavorites ? "Showing your favourites" : "Showing all gyms",
        description: "Updating view...",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearchQuery) {
        params.set("query", localSearchQuery);
      } else {
        params.delete("query");
      }

      const currentQuery = searchParams.get("query") || "";
      if (currentQuery !== localSearchQuery) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, router, searchParams]);

  const handleSort = (key: SortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    let newDirection: "asc" | "desc" = "asc";

    if (key !== sortKey) {
      if (key === "gymName") newDirection = "asc";
      else if (key === "perRack") newDirection = "asc";
      else newDirection = "desc";
    } else {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }

    params.set("sort", key);
    params.set("order", newDirection);
    setIsDropdownOpen(false);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleToggleDirection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("order", sortDirection === "asc" ? "desc" : "asc");
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

  const uniqueStates = useMemo(() => {
    const states = gymResponse.data
      .map((gym) => gym.state)
      .filter((state): state is string => !!state);
    return Array.from(new Set(states)).sort();
  }, [gymResponse.data]);

  const processedGyms = useMemo(() => {
    let gyms = Array.isArray(gymResponse.data) ? [...gymResponse.data] : [];

    if (localSearchQuery) {
      gyms = gyms.filter((gym: Gym) =>
        gym.gymName.toLowerCase().includes(localSearchQuery.toLowerCase()),
      );
    }

    if (selectedState && selectedState !== "All States") {
      gyms = gyms.filter((gym) => gym.state === selectedState);
    }

    if (!hasGymPreferences && showFavoritesLocal) {
      gyms = gyms.filter((gym) => favorites.includes(gym.gymName));
    }

    return gyms;
  }, [gymResponse.data, localSearchQuery, selectedState, hasGymPreferences, showFavoritesLocal, favorites]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const gridClassMap: Record<string | number, string> = {
    // Auto tops out at three columns: a fourth squeezes "members now" onto a
    // second line at 1280px.
    auto: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  const currentSortLabel = getSortLabel(sortKey);
  const totalGyms = gymResponse.data.length;

  const favoritesToggle = (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      <span>Favourites only</span>
      <button
        type="button"
        role="switch"
        aria-checked={isShowingFavorites}
        aria-label="Show favourites only"
        onClick={handleToggleFavorites}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
          isShowingFavorites ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
            isShowingFavorites ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );

  const stateSelect = (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">Filter by state</span>
      <span aria-hidden="true">State</span>
      <span className="relative">
        <select
          className="h-11 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          aria-label="Filter by state"
        >
          <option value="All States">All states</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );

  const layoutSelect = (
    <label className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
      <span className="sr-only">Column layout</span>
      <span aria-hidden="true">Layout</span>
      <span className="relative">
        <select
          className="h-11 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          value={columns}
          onChange={(e) => setColumns(e.target.value === "auto" ? "auto" : Number(e.target.value))}
          aria-label="Column layout"
        >
          <option value="auto">Automatic</option>
          {Array.from({ length: 4 }, (_, i) => i + 1)
            .filter((num) => num <= maxColumns)
            .map((num) => (
              <option key={num} value={num}>
                {num} column{num === 1 ? "" : "s"}
              </option>
            ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Gyms</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {processedGyms.length === totalGyms
                ? `${totalGyms} Revo locations, live`
                : `${processedGyms.length} of ${totalGyms} locations`}
            </p>
          </div>
        </header>

        <div className="relative z-20 mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search gyms"
                aria-label="Search locations"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden sm:block">{favoritesToggle}</div>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters"}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background transition-colors hover:bg-muted/50 sm:hidden"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          {/* Filters: collapsed on phones, always visible from sm up */}
          <div
            className={`${filtersOpen ? "block" : "hidden"} mt-4 space-y-4 border-t border-border pt-4 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:space-y-0 sm:border-0 sm:pt-0`}
          >
            <SortDropdown
              label={currentSortLabel}
              sortKey={sortKey}
              sortDirection={sortDirection}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen((open) => !open)}
              onSort={handleSort}
              onToggleDirection={handleToggleDirection}
              containerRef={dropdownRef}
            />
            {stateSelect}
            {layoutSelect}
            <div className="sm:hidden">{favoritesToggle}</div>
          </div>
        </div>

        {processedGyms.length > 0 ? (
          <div className={`grid ${gridClassMap[columns]} gap-5`}>
            {processedGyms.map((gym) => (
              <LocationCard
                key={gym.id}
                gym={gym}
                className="max-w-none"
                isFavorite={isFavorite(gym.gymName)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Search size={40} className="mb-4 opacity-30" aria-hidden="true" />
            <p className="text-lg font-medium text-foreground">No gyms found</p>
            <p className="mt-1 max-w-xs text-sm">
              {localSearchQuery
                ? `Nothing matches "${localSearchQuery}". Try a different name.`
                : "Try clearing the state filter or turning off favourites."}
            </p>
            {(localSearchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchQuery("");
                  setShowFavoritesLocal(false);
                  router.replace("?", { scroll: false });
                }}
                className="mt-4 h-11 rounded-lg border border-input px-4 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
