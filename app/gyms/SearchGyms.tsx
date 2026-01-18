"use client";
import { Input } from "@/components/ui/input";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export default function SearchGyms() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();

	const handleSearch = (searchTerm: string) => {
		const params = new URLSearchParams(searchParams);

		if (searchTerm) {
			params.set("query", searchTerm);
		} else {
			params.delete("query");
		}
		replace(`${pathname}?${params.toString()}`);
	};

	return (
		<div>
			<Input
				defaultValue={searchParams.get("query")?.toString()}
				placeholder="Search for a Gym"
				onChange={(e) => {
					handleSearch(e.target.value);
				}}
			></Input>
		</div>
	);
}
