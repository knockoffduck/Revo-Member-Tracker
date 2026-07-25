import { createAdminPb } from "@/lib/server/pocketbase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const pb = await createAdminPb();
	const data = await pb.collection("Revo_Gyms").getFullList({
		sort: "name",
		batch: 200,
	});
	if (data.length === 0) {
		return NextResponse.json({
			success: false,
			message: "No gym data found.",
		});
	}
	return NextResponse.json(data);
}
