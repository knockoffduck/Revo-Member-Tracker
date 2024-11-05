import { ModeToggle } from "@/components/ui/darkmode";
import GymList from "./GymList";
import SearchGyms from "./SearchGyms";
import { getGyms } from "@/lib/fetchData";

export default async function Home({
	searchParams,
}: {
	searchParams?: { query?: string };
}) {
	const query = searchParams?.query || "";
	const response = await getGyms();

	return (
		<div className="w-full h-full px-8 justify-center pt-6 gap-6 ">
			<div className="flex flex-col gap-6">
				<SearchGyms></SearchGyms>
				<GymList query={query} gymResponse={response}></GymList>
			</div>
		</div>
	);
}
