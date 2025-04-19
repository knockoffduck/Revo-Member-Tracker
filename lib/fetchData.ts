import { Gym, GymResponse } from "@/app/_types";
import { PostgrestResponse } from "@supabase/supabase-js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { convertToLocalHour, convertUTCToLocalTime } from "./utils";
import { db } from "@/app/db/database";
import { revoGymCount, revoGyms, user } from "@/app/db/schema";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { raw } from "mysql2";
import { auth } from "./auth";
import { headers } from "next/headers";
import { saveToFile } from "./filewriter";

dayjs.extend(utc);
dayjs.extend(timezone);

export const revalidate = 0;

export const getGyms = async (gyms?: string[]) => {
  let latestData: Gym[] = [];
  try {
    const latestTime = await db
      .select({ created: revoGymCount.created })
      .from(revoGymCount)
      .orderBy(desc(revoGymCount.created))
      .limit(1);
    if (!latestTime) {
      throw new Error("No entries found in the database");
    }
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;
    if (!userId) {
      latestData = await db
        .select()
        .from(revoGymCount)
        .where(eq(revoGymCount.created, latestTime[0].created))
        .orderBy(desc(revoGymCount.percentage));
    } else {
      const gymPreferences = await db
        .select({ gymPreferences: user.gymPreferences })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      latestData = await db
        .select()
        .from(revoGymCount)
        .where(
          and(
            eq(revoGymCount.created, latestTime[0].created),
            inArray(
              revoGymCount.gymName,
              gymPreferences[0].gymPreferences as string[],
            ),
          ),
        );
    }
    const result: GymResponse = {
      timestamp: latestTime[0].created,
      data: latestData,
    };
    return result;
    // return result;
  } catch (error) {
    console.error("Error fetching gym data:", error);
    throw error;
  }
};

export const getGymStats = async (gymName: string) => {
  // const supabase = supabaseClient();

  const nowInPerth = dayjs().tz("Australia/Perth");

  // Get midnight time in Australia/Perth timezone
  const startOfDayInPerth = nowInPerth.startOf("day");

  const data = await db
    .select()
    .from(revoGymCount)
    .where(
      and(
        eq(revoGymCount.gymName, gymName),
        gte(revoGymCount.created, startOfDayInPerth.utc().format()),
        lte(revoGymCount.created, nowInPerth.utc().format()),
      ),
    )
    .orderBy(asc(revoGymCount.created));
  await saveToFile(`${gymName}.json`, JSON.stringify(data));

  return data;
};
