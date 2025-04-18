import { db } from "@/app/db/database";
import { revoGyms, user } from "@/app/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user?.id) {
		return NextResponse.json({
			success: false,
			message: "User not authenticated",
		});
	}
	const userId = session.user.id;
	const data = await db
		.select({ GymPreferences: user.gymPreferences })
		.from(user)
		.where(eq(user.id, userId));
	return NextResponse.json(data);
}
