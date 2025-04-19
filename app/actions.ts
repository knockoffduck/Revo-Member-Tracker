"use server";

import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema";
import { auth } from "@/lib/auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const fetchGyms = async (formData: FormData, currentTime: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;
  const rawData = JSON.parse(Object.fromEntries(formData).gyms as string);
  const showAllGyms = rawData.show_all;

  if (!userId) {
    const data = await db
      .select()
      .from(revoGymCount)
      .where(eq(revoGymCount.created, currentTime))
      .orderBy(desc(revoGymCount.percentage));
    return data;
  } else {
    if (showAllGyms) {
      const data = await db
        .select()
        .from(revoGymCount)
        .where(eq(revoGymCount.created, currentTime))
        .orderBy(desc(revoGymCount.percentage));
      return data;
    } else {
      const gymPreferences = await db
        .select({
          gymPreferences: user.gymPreferences,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      const data = await db
        .select()
        .from(revoGymCount)
        .where(
          and(
            eq(revoGymCount.created, currentTime),
            inArray(
              revoGymCount.gymName,
              gymPreferences[0].gymPreferences as string[],
            ),
          ),
        );
      return data;
    }
  }
};
