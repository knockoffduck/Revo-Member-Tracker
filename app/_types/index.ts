export type Gym = {
	name: string;
	size: number;
	member_count: number;
	member_ratio: number;
	percentage: number;
	created_at: string;
};

export type GymResponse = {
	timestamp: string;
	data: Gym[]; // Contains all entries with the same latest `created_at`
};
