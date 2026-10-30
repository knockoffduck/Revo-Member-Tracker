import { NextResponse } from "next/server";
import { clearDataCaches } from "@/lib/fetchData";

/**
 * Drops the in-process data caches behind the manual refresh button.
 *
 * Clearing itself is free, but the next render then hits PocketBase, so a short
 * floor stops a held-down button from turning into a request flood.
 */
const MIN_INTERVAL_MS = 2000;
let lastClearedAt = 0;

export async function POST() {
  const now = Date.now();
  const cleared = now - lastClearedAt >= MIN_INTERVAL_MS;

  if (cleared) {
    clearDataCaches();
    lastClearedAt = now;
  }

  return NextResponse.json(
    { ok: true, cleared, at: new Date(now).toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
