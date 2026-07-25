import PocketBase from "pocketbase";

const url = process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "https://pb.dvcklab.work";

export const createPublicPb = (): PocketBase => new PocketBase(url);

// Cache the admin auth TOKEN (not a per-instance auth promise). Each call gets a
// fresh PocketBase instance and applies the cached token synchronously, so
// concurrent callers never end up with an unauthenticated instance.
let cachedAdminToken: string | null = null;
let cachedAdminTokenExpiry = 0;
let adminAuthInFlight: Promise<string> | null = null;

export const createAdminPb = async (): Promise<PocketBase> => {
	const pb = new PocketBase(url);
	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;

	if (!email || !password) {
		throw new Error("POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required for admin operations");
	}

	const now = Date.now();
	// Reuse the cached token while it still has >60s of validity left.
	if (cachedAdminToken && cachedAdminTokenExpiry - now > 60_000) {
		pb.authStore.save(cachedAdminToken, null);
		return pb;
	}

	// Deduplicate concurrent refreshes: only one auth request in flight at a time.
	if (!adminAuthInFlight) {
		adminAuthInFlight = pb.admins
			.authWithPassword(email, password)
			.then((res) => {
				cachedAdminToken = res.token;
				const decoded = decodeJwt(res.token);
				// Default to ~30min if we can't decode an expiry.
				cachedAdminTokenExpiry = decoded?.exp ? decoded.exp * 1000 : now + 30 * 60_000;
				adminAuthInFlight = null;
				return res.token;
			})
			.catch((err) => {
				adminAuthInFlight = null;
				throw err;
			});
	}

	const token = await adminAuthInFlight;
	pb.authStore.save(token, null);
	return pb;
};

function decodeJwt(token: string): { id?: string; exp?: number; collectionId?: string } | null {
	try {
		const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
		const json = atob(base64);
		return JSON.parse(json);
	} catch {
		return null;
	}
}
