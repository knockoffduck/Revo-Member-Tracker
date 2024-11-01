import Chart from "@/app/components/Chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";

function getPreviousDate(date: Date): Date {
	const previousDate = new Date(date);
	previousDate.setDate(date.getDate() - 1);
	return previousDate;
}

export default async function page({ params }: { params: { name: string } }) {
	const supabase = supabaseClient();
	const gymName = decodeURIComponent(params.name);

	const today = new Date();

	// Get current local date
	const localToday = new Date(today);

	// Format the date as YYYY-MM-DD for the local timezone
	const localTodayDate = localToday.toISOString().split("T")[0];
	const previousDate = getPreviousDate(today).toISOString().split("T")[0];

	// Get the start of the day in UTC based on local timezone
	const localStartofDayUTC = new Date(
		`${previousDate}T16:00:00.000Z`
	).toISOString();

	// Get the end of the day in UTC based on local timezone
	const localEndOfDayUTC = new Date(
		`${localTodayDate}T16:00:00.000Z`
	).toISOString();
	console.log(localTodayDate);
	console.log(localStartofDayUTC, ":", localEndOfDayUTC);

	// Query for records created today (based on local time)
	const { data, error } = await supabase
		.from("Revo Member Stats")
		.select()
		.eq("name", gymName)
		.gte("created_at", localStartofDayUTC)
		.lt("created_at", localEndOfDayUTC);

	if (error) {
		console.error("Error fetching data: ", error.message);
		return <div>Error fetching data</div>;
	}

	// Safeguard: if data is not available or empty
	if (!data || data.length === 0) {
		return <div>No data available for {gymName}</div>;
	}

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
			<Chart data={data}></Chart>
		</Card>
	);
}
