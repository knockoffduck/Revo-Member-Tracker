import { z } from "zod";

export type GymMutationResult = {
	success: boolean;
	message: string;
	data?: { id?: string };
	error?: unknown;
};

export const gymSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
	state: z.string().trim().min(1, "State is required").max(50),
	areaSize: z
		.number()
		.int("Area size must be a whole number")
		.min(0, "Area size cannot be negative")
		.max(1_000_000),
	address: z.string().trim().min(1, "Address is required").max(500),
	postcode: z.number().int("Postcode must be a whole number").min(0, "Postcode cannot be negative").max(99999),
	active: z.union([z.literal(0), z.literal(1), z.boolean()], { message: "Active must be 0, 1, or a boolean" }),
	timezone: z.string().trim().min(1, "Timezone is required").max(50).default("Australia/Perth"),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	squatRacks: z.number().int("Squat racks must be a whole number").min(0, "Squat racks cannot be negative").max(255).default(0),
});
