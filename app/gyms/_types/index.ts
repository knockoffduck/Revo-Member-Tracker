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
};

export type GymResponse = {
	timestamp: string;
	data: Gym[]; // Contains all entries with the same latest `created_at`
};
