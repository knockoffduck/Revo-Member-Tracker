import { db } from "@/app/db/database";
import { revoGyms } from "@/app/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
	const data = await db.select().from(revoGyms).orderBy(revoGyms.name);
	if (data.length === 0) {
		return NextResponse.json({
			success: false,
			message: "No gym data found.",
		});
	}
	return NextResponse.json(data);
}
