"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast, Toaster } from "sonner";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { updateGymPreferences } from "@/app/auth/actions";

const gyms = [
	{
		name: "Balcatta",
	},
	{
		name: "Banksia Grove",
	},
	{
		name: "Belmont",
	},
	{
		name: "Canning Vale",
	},
	{
		name: "Cannington",
	},
	{
		name: "Claremont",
	},
	{
		name: "Clarkson",
	},
	{
		name: "Cockburn",
	},
	{
		name: "Ellenbrook",
	},
	{
		name: "Girrawheen",
	},
	{
		name: "Innaloo",
	},
	{
		name: "Joondalup",
	},
	{
		name: "Kelmscott",
	},
	{
		name: "Kwinana",
	},
	{
		name: "Malaga",
	},
	{
		name: "Mandurah",
	},
	{
		name: "Midland",
	},
	{
		name: "Mirrabooka",
	},
	{
		name: "Mount Hawthorn",
	},
	{
		name: "Myaree",
	},
	{
		name: "Northbridge",
	},
	{
		name: "OConnor",
	},
	{
		name: "Rockingham",
	},
	{
		name: "Scarborough",
	},
	{
		name: "Victoria Park",
	},
	{
		name: "Warwick",
	},
	{
		name: "Beverley",
	},
	{
		name: "Blair Athol",
	},
	{
		name: "Glenelg",
	},
	{
		name: "Parafield",
	},
	{
		name: "Windsor Gardens",
	},
	{
		name: "Woodcroft",
	},
	{
		name: "Cranbourne",
	},
	{
		name: "Langwarrin",
	},
	{
		name: "Narre Warren",
	},
	{
		name: "Noble Park",
	},
	{
		name: "Plenty Valley",
	},
	{
		name: "Woodville",
	},
	{
		name: "Shenton Park",
	},
	{
		name: "Shellharbour",
	},
	{
		name: "Morley",
	},
	{
		name: "Modbury",
	},
	{
		name: "Mentone",
	},
	{
		name: "Marion",
	},
	{
		name: "Happy Valley",
	},
	{
		name: "Charlestown",
	},
] as const;

const FormSchema = z.object({
	gyms: z.array(z.string()).refine((value) => value.some((item) => item), {
		message: "You have to select at least one item.",
	}),
});

export function GymsCheckBox({ userId }: { userId: string }) {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			gyms: [], // Initialize gyms as an empty array
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const error = await updateGymPreferences(userId, data.gyms);

		if (error.errorMessage) {
			toast.error(error.errorMessage);
		} else {
			toast.success("Gym preferences successfully updated");
		}
	}

	return (
		<Form {...form}>
			<Toaster></Toaster>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="gyms"
					render={() => (
						<FormItem>
							<div className="mb-4">
								<FormLabel className="text-base">Gyms</FormLabel>
								<FormDescription>
									Select the gyms you would like shown on the homepage.
								</FormDescription>
							</div>
							{gyms.map((gym) => (
								<FormField
									key={gym.name}
									control={form.control}
									name="gyms"
									render={({ field }) => {
										return (
											<FormItem
												key={gym.name}
												className="flex flex-row items-start space-x-3 space-y-0"
											>
												<FormControl>
													<Checkbox
														checked={field.value?.includes(gym.name) || false} // Fallback to false if undefined
														onCheckedChange={(checked: boolean) => {
															return checked
																? field.onChange([
																		...(field.value || []),
																		gym.name,
																  ])
																: field.onChange(
																		field.value?.filter(
																			(value) => value !== gym.name
																		) || []
																  );
														}}
													/>
												</FormControl>
												<FormLabel className="font-normal">
													{gym.name}
												</FormLabel>
											</FormItem>
										);
									}}
								/>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
}
