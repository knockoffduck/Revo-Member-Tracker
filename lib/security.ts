import { headers } from "next/headers";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

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
