import { ModeToggle } from "@/components/ui/darkmode";
import GymList from "./GymList";
import SearchGyms from "./SearchGyms";
import { getGyms } from "@/lib/fetchData";
import { Gym, GymResponse } from "./_types";

type GymPreferencesResponse = string[] | { errorMessage: string };

// Type guard to check if the result is an error object
function isErrorResponse(
	obj: GymPreferencesResponse
): obj is { errorMessage: string } {
	return typeof obj === "object" && "errorMessage" in obj;
}
export default async function Home(props: {
	searchParams?: Promise<{ query?: string }>;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams?.query || "";
	const response: GymResponse = await getGyms();
	console.log("response", response);


	return (
		<div className="w-full px-8 justify-center pt-6 gap-6 ">
			<div className="flex flex-col gap-6">
				<SearchGyms></SearchGyms>
				<GymList query={query} gymResponse={response}></GymList>
			</div>
		</div>
	);
}
