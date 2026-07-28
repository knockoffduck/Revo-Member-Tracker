import { headers } from "next/headers";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// The store is keyed by client IP and never expires entries on its own, so a
// flood of distinct IPs would grow it without bound. Sweep out expired buckets
// periodically (and hard-cap the size) to keep memory usage bounded.
const MAX_RATE_LIMIT_ENTRIES = 100_000;
let lastSweep = 0;

function sweepExpiredEntries(now: number) {
	if (now - lastSweep < 60_000) return;
	lastSweep = now;

	for (const [key, entry] of rateLimitStore) {
		if (entry.resetAt <= now) {
			rateLimitStore.delete(key);
		}
	}

	// Hard cap: if still over the limit, drop the oldest-resetting entries.
	if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
		const overflow = rateLimitStore.size - MAX_RATE_LIMIT_ENTRIES;
		const oldest = [...rateLimitStore.entries()]
			.sort((a, b) => a[1].resetAt - b[1].resetAt)
			.slice(0, overflow);
		for (const [key] of oldest) {
			rateLimitStore.delete(key);
		}
	}
}

export async function getClientIp() {
	const headerStore = await headers();
	const forwardedFor = headerStore.get("x-forwarded-for");
	const realIp = headerStore.get("x-real-ip");

	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? "unknown";
	}

	return realIp?.trim() ?? "unknown";
}

export async function enforceRateLimit(
	key: string,
	options: {
		limit: number;
		windowMs: number;
	}
) {
	const ip = await getClientIp();
	const now = Date.now();
	sweepExpiredEntries(now);
	const bucketKey = `${key}:${ip}`;
	const current = rateLimitStore.get(bucketKey);

	if (!current || current.resetAt <= now) {
		rateLimitStore.set(bucketKey, {
			count: 1,
			resetAt: now + options.windowMs,
		});
		return;
	}

	if (current.count >= options.limit) {
		const retryAfterSeconds = Math.max(
			1,
			Math.ceil((current.resetAt - now) / 1000)
		);
		throw new Error(
			`Too many requests. Please try again in ${retryAfterSeconds} seconds.`
		);
	}

	current.count += 1;
	rateLimitStore.set(bucketKey, current);
}
