import { NextResponse, type NextRequest } from "next/server";

// ── IP Request Tracker ───────────────────────────────────────────────────────
interface IpRecord {
	count: number;
	firstSeen: number;
	lastSeen: number;
	paths: Set<string>;
	userAgents: Set<string>;
}

const ipTracker = new Map<string, IpRecord>();
const IP_LOG_INTERVAL_MS = 60 * 1000; // Log summary every 60s
const IP_SUSPICIOUS_THRESHOLD = 30; // Flag IPs with >30 req/min
const IP_TRACKER_MAX_ENTRIES = 50_000; // Hard cap to bound memory within a window
let lastSummaryLog = Date.now();

function trackRequest(ip: string, pathname: string, userAgent: string) {
	const now = Date.now();

	// Bound memory: if the tracker is full, reset it early rather than letting a
	// flood of distinct IPs grow the Map without limit.
	if (ipTracker.size >= IP_TRACKER_MAX_ENTRIES) {
		logIpSummary();
	}

	const existing = ipTracker.get(ip);

	if (!existing) {
		ipTracker.set(ip, {
			count: 1,
			firstSeen: now,
			lastSeen: now,
			paths: new Set([pathname]),
			userAgents: new Set([userAgent.slice(0, 80)]),
		});
	} else {
		existing.count += 1;
		existing.lastSeen = now;
		existing.paths.add(pathname);
		existing.userAgents.add(userAgent.slice(0, 80));
	}

	// Log individual requests that look suspicious (high frequency)
	const record = ipTracker.get(ip)!;
	if (record.count === IP_SUSPICIOUS_THRESHOLD) {
		console.warn(
			`[IP-TRACKER] ⚠️  Suspicious activity: ${ip} hit ${record.count} requests in window | paths: ${[...record.paths].slice(0, 5).join(", ")} | UA: ${userAgent.slice(0, 60)}`
		);
	}

	// Periodic summary
	if (now - lastSummaryLog >= IP_LOG_INTERVAL_MS) {
		lastSummaryLog = now;
		logIpSummary();
	}
}

function logIpSummary() {
	if (ipTracker.size === 0) return;

	const entries = [...ipTracker.entries()].sort(
		(a, b) => b[1].count - a[1].count
	);
	const totalRequests = entries.reduce((sum, [, r]) => sum + r.count, 0);
	const topIps = entries.slice(0, 10);

	console.log(
		`[IP-TRACKER] Summary (${ipTracker.size} unique IPs, ${totalRequests} total requests):`
	);
	for (const [ip, record] of topIps) {
		const flag = record.count >= IP_SUSPICIOUS_THRESHOLD ? " ⚠️ " : " ";
		console.log(
			`[IP-TRACKER]${flag}${ip}: ${record.count} reqs | ${record.paths.size} paths | UA: ${[...record.userAgents][0] ?? "none"}`
		);
	}

	// Reset tracker for next window
	ipTracker.clear();
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_BOTS = 40; // per window per IP for bots/unhuman requests
const RATE_LIMIT_MAX_ENTRIES = 50_000; // Hard cap to bound memory
let lastRateLimitSweep = 0;

function sweepRateLimitStore(now: number) {
	if (now - lastRateLimitSweep < 60_000) return;
	lastRateLimitSweep = now;
	for (const [ip, entry] of rateLimitStore) {
		if (entry.resetAt <= now) {
			rateLimitStore.delete(ip);
		}
	}
}

function getClientIp(request: NextRequest): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");

	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? "unknown";
	}

	return realIp?.trim() ?? "unknown";
}

// ── Trusted IPs ──────────────────────────────────────────────────────────────
// Comma-separated IPv4/IPv6 addresses or IPv4 CIDR blocks, e.g.
// TRUSTED_IPS=203.0.113.7,198.51.100.0/24
const TRUSTED_IPS = (process.env.TRUSTED_IPS ?? "")
	.split(",")
	.map((entry) => entry.trim())
	.filter(Boolean);

function normaliseIp(value: string): string {
	const trimmed = value.trim().toLowerCase();
	const unbracketed = trimmed.startsWith("[") && trimmed.includes("]")
		? trimmed.slice(1, trimmed.indexOf("]"))
		: trimmed;
	// ::ffff:1.2.3.4 is IPv4 wearing an IPv6 hat.
	return unbracketed.startsWith("::ffff:") ? unbracketed.slice(7) : unbracketed;
}

function ipv4ToInt(ip: string): number | null {
	const parts = ip.split(".");
	if (parts.length !== 4) return null;
	let value = 0;
	for (const part of parts) {
		if (!/^\d{1,3}$/.test(part)) return null;
		const octet = Number(part);
		if (octet > 255) return null;
		value = value * 256 + octet;
	}
	return value;
}

function matchesEntry(ip: string, entry: string): boolean {
	const candidate = normaliseIp(ip);
	const target = normaliseIp(entry);

	if (candidate === target) return true;

	if (target.includes("/")) {
		const [network, bitsRaw] = target.split("/");
		const bits = Number(bitsRaw);
		if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

		const networkValue = ipv4ToInt(network);
		const candidateValue = ipv4ToInt(candidate);
		if (networkValue === null || candidateValue === null) return false;

		// /0 would make every address match, which is never intended.
		if (bits === 0) return false;
		const mask = bits === 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
		return (networkValue & mask) === (candidateValue & mask);
	}

	return false;
}

function isTrustedIp(ip: string): boolean {
	if (!ip || ip === "unknown" || TRUSTED_IPS.length === 0) return false;
	return TRUSTED_IPS.some((entry) => matchesEntry(ip, entry));
}

/**
 * The client address as seen by our own proxy rather than the client itself.
 * Traefik appends the real peer to any x-forwarded-for it receives, so the last
 * entry cannot be forged; the first entry can be.
 */
function isTrustedRequest(request: NextRequest): boolean {
	if (TRUSTED_IPS.length === 0) return false;

	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		const hops = forwardedFor.split(",").map((hop) => hop.trim()).filter(Boolean);
		const peer = hops[hops.length - 1];
		if (peer && isTrustedIp(peer)) return true;
	}

	const realIp = request.headers.get("x-real-ip");
	return !!realIp && isTrustedIp(realIp);
}

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	sweepRateLimitStore(now);

	// If the store is at capacity, drop the oldest-resetting entry to make room
	// so a flood of distinct IPs cannot grow it without bound.
	if (!rateLimitStore.has(ip) && rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
		let oldestKey: string | null = null;
		let oldestReset = Infinity;
		for (const [key, entry] of rateLimitStore) {
			if (entry.resetAt < oldestReset) {
				oldestReset = entry.resetAt;
				oldestKey = key;
			}
		}
		if (oldestKey) rateLimitStore.delete(oldestKey);
	}

	const current = rateLimitStore.get(ip);

	if (!current || current.resetAt <= now) {
		rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}

	if (current.count >= RATE_LIMIT_MAX_BOTS) {
		return true;
	}

	current.count += 1;
	rateLimitStore.set(ip, current);
	return false;
}

// ── Bot detection ────────────────────────────────────────────────────────────
const BAD_BOTS = [
	"semrush",
	"ahrefs",
	"mj12bot",
	"dotbot",
	"petalbot",
	"serpstat",
	"screaming frog",
	"gptbot",
	"claudebot",
	"ccbot",
	"dataforseo",
	"zoominfo",
	"headless",
	"phantom",
	"selenium",
	"puppeteer",
	"playwright",
	"scrapy",
	"python-requests",
	"python-urllib",
	"curl",
	"wget",
	"httpie",
	"go-http-client",
	"java/",
	"okhttp",
	"apache-httpclient",
];

const GOOD_BOTS = [
	"googlebot",
	"bingbot",
	"slurp",
	"duckduckbot",
	"baiduspider",
	"yandexbot",
	"facebookexternalhit",
	"twitterbot",
	"linkedinbot",
	"whatsapp",
	"telegrambot",
	"discordbot",
	"applebot",
];

function isBot(userAgent: string): boolean {
	const ua = userAgent.toLowerCase();
	return BAD_BOTS.some((bot) => ua.includes(bot));
}

function isGoodBot(userAgent: string): boolean {
	const ua = userAgent.toLowerCase();
	return GOOD_BOTS.some((bot) => ua.includes(bot));
}

// A request is considered unhuman if it comes from a recognized crawler/bot
// (good or bad) or has no User-Agent at all (typical of scripts and scrapers).
// Only these requests are subject to the global rate limit; normal browser
// traffic from real users is not rate limited here.
function isNonHumanRequest(userAgent: string): boolean {
	const ua = userAgent.trim();
	if (ua === "") return true;
	return isBot(ua) || isGoodBot(ua);
}

// ── HTTPS redirect ───────────────────────────────────────────────────────────
function shouldRedirectToHttps(request: NextRequest) {
	if (process.env.NODE_ENV !== "production") {
		return false;
	}

	const proto = request.headers.get("x-forwarded-proto");
	const hostname = request.nextUrl.hostname;
	const isLocalhost =
		hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

	return proto === "http" && !isLocalhost;
}

// ── Middleware ───────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
	// HTTPS redirect
	if (shouldRedirectToHttps(request)) {
		const secureUrl = request.nextUrl.clone();
		secureUrl.protocol = "https:";
		return NextResponse.redirect(secureUrl, 301);
	}

	// Skip rate limiting for static assets and internal Next.js requests
	const pathname = request.nextUrl.pathname;
	if (
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/favicon") ||
		pathname.startsWith("/robots") ||
		pathname.startsWith("/sitemap") ||
		pathname.startsWith("/manifest") ||
		pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/)
	) {
		return NextResponse.next();
	}

	const ip = getClientIp(request);
	const userAgent = request.headers.get("user-agent") ?? "";
	// Your own addresses skip the bot filter and the bot rate limit. The check
	// reads the proxy-appended hop, so a forged x-forwarded-for cannot opt in.
	const trusted = isTrustedRequest(request);

	// Track IP for bot detection visibility
	trackRequest(ip, pathname, userAgent);

	// Block bad bots entirely
	if (!trusted && isBot(userAgent)) {
		console.warn(`[IP-TRACKER] Blocked bad bot: ${ip} | UA: ${userAgent.slice(0, 80)}`);
		return new NextResponse("Forbidden", { status: 403 });
	}

	// Rate limit only known bots / unhuman requests. Real browser traffic is
	// not rate limited here; authentication endpoints keep their own stricter
	// per-action rate limits (see lib/security.ts).
	if (!trusted && isNonHumanRequest(userAgent) && isRateLimited(ip)) {
		console.warn(`[IP-TRACKER] Rate limited bot: ${ip} | path: ${pathname} | UA: ${userAgent.slice(0, 60)}`);
		return new NextResponse("Too Many Requests", {
			status: 429,
			headers: {
				"Retry-After": "60",
			},
		});
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
