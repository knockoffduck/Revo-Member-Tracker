import { ModeToggle } from "@/components/ui/darkmode";
import GymList from "./GymList";
import SearchGyms from "./SearchGyms";
import { getGyms } from "@/lib/fetchData";
import { getUser } from "@/utils/supabase/server";
import { getGymPreferences } from "./auth/actions";
import { Gym } from "./_types";

// Type guard to check if the result is an error object
function isErrorResponse(obj: any): obj is { errorMessage: string } {
	return obj && typeof obj.errorMessage === "string";
}

export default async function Home(props: {
	searchParams?: Promise<{ query?: string }>;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams?.query || "";
	const user = await getUser();
	let response;

	if (user) {
		// Fetch gym preferences for the user
		const gymPreferences = await getGymPreferences(user.id);

		if (isErrorResponse(gymPreferences)) {
			// Handle the error case
			console.error(
				"Error fetching gym preferences:",
				gymPreferences.errorMessage
			);
			throw new Error(gymPreferences.errorMessage);
		} else if (gymPreferences.length > 0) {
			// Use gym preferences if available
			response = await getGyms(gymPreferences);
		} else {
			// No preferences, fetch all gyms
			response = await getGyms();
		}
	} else {
		// If no user, fetch all gyms
		response = await getGyms();
	}

	return (
		<div className="w-full px-8 justify-center pt-6 gap-6 ">
			<div className="flex flex-col gap-6">
				<SearchGyms></SearchGyms>
				<GymList query={query} gymResponse={response}></GymList>
			</div>
		</div>
	);
}
