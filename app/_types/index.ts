export type Gym = {
	id: string;
	created: string;
	count: number;
	ratio: number;
	gymName: string;
	percentage: number | null;
	gymId: string;
};

export type GymResponse = {
	timestamp: string;
	data: Gym[]; // Contains all entries with the same latest `created_at`
};
