import Chart from "@/app/components/Chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { getGymStats } from "@/lib/fetchData";
import { supabaseClient } from "@/lib/supabaseClient";
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
	const supabase = supabaseClient();
	const gymName = decodeURIComponent(params.name);

	const data = await getGymStats(gymName);

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
