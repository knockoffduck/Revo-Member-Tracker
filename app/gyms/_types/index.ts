export type Gym = {
	id: string;
	created: string;
	count: number;
	ratio: number;
	gymName: string;
	percentage: number;
	gymId: string;
	areaSize: number;
	state: string;
	timezone: string;
	squatRacks: number;
};

export type GymResponse = {
	timestamp: string;
	data: Gym[]; // Contains all entries with the same latest `created_at`
};

export type SortKey = "percentage" | "perRack" | "count" | "areaSize" | "rackAmount" | "gymName";

export type SortOption = {
	key: SortKey;
	label: string;
	section: "occupancy" | "facilities" | "general";
};

export const SORT_OPTIONS: SortOption[] = [
	{ key: "percentage", label: "Crowd Percentage", section: "occupancy" },
	{ key: "perRack", label: "Rack Ratio", section: "occupancy" },
	{ key: "count", label: "Members", section: "occupancy" },
	{ key: "areaSize", label: "Size", section: "facilities" },
	{ key: "rackAmount", label: "Racks", section: "facilities" },
	{ key: "gymName", label: "Name", section: "general" },
];

export const getSortLabel = (key: SortKey): string => {
	const option = SORT_OPTIONS.find((opt) => opt.key === key);
	return option?.label || key;
};
