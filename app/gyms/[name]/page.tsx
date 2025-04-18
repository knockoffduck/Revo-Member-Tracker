import Chart from "@/app/components/Chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { getGymStats } from "@/lib/fetchData";
import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";

function getPreviousDate(date: Date): Date {
	const previousDate = new Date(date);
	previousDate.setDate(date.getDate() - 1);
	return previousDate;
}

export default async function page(props: {
	params: Promise<{ name: string }>;
}) {
	const params = await props.params;
	const gymName = decodeURIComponent(params.name);

	const data = await getGymStats(gymName);


	// const groupedData: {
	// 	[key: string]: {
	// 		member_count: number[];
	// 		member_ratio: number[];
	// 		percentage: number[];
	// 	};
	// } = {};

	const convertToLocalTime = (date: Date): string => {
		const offsetMinutes = date.getTimezoneOffset();
		const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
		return localDate.toISOString()
	}

	const localisedData = data.map((item) => {
		const localTime = convertToLocalTime(new Date(item.created));
		const localisedItem = {
			...item,
			created: localTime,
		};
		return localisedItem;
	});
	console.log("localisedData", localisedData);





	return (
		<Card className="p-6 border-0 grid justify-center">
			<Link href={"/"}>
				<Button>
					<IoArrowBackOutline></IoArrowBackOutline>
				</Button>
			</Link>
			<CardHeader className="text-center font-bold text-2xl">
				{gymName}
			</CardHeader>

			<Chart data={localisedData}></Chart>
		</Card>
	);
}
