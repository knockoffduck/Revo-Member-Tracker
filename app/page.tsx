import { getGyms } from "@/lib/fetchData"; // Assuming getGyms is here
import SearchGyms from "./SearchGyms"; // Corrected import path assumption
import GymList from "./GymList"; // Corrected import path assumption
import { GymResponse } from "./_types"; // Assuming type is here

// Keep your isErrorResponse function if needed elsewhere, but it's not used in this fix
// function isErrorResponse(
// 	obj: GymPreferencesResponse // Note: This type might be different from GymResponse
// ): obj is { errorMessage: string } {
// 	return typeof obj === "object" && "errorMessage" in obj;
// }

export default async function Home(props: {
	searchParams?: Promise<{ query?: string }>;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams?.query || "";
	let response: GymResponse | undefined = undefined;
	let fetchError: string | null = null;

	try {
		// Let TypeScript infer the type or explicitly type as potentially undefined
		response = await getGyms();
	} catch (error) {
		console.error("Failed to fetch gyms:", error);
		fetchError = "Could not load gym data. Please try again later.";
	}
	console.log("Response:", response);

	return (
		<div className="w-full px-8 justify-center pt-6 gap-6 ">
			<div className="flex flex-col gap-6">
				<SearchGyms />
				{fetchError ? (
					<p className="text-red-500">{fetchError}</p>
				) : response ? (
					// Only render GymList if response is defined and not null/undefined
					<GymList query={query} gymResponse={response} />
				) : (
					// Optional: Handle the case where response is undefined (e.g., loading or no data)
					// You might want a more sophisticated loading state here
					<p>Loading gyms...</p>
				)}
			</div>
		</div>
	);
}
