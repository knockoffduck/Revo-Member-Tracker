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
let lastSummaryLog = Date.now();

function trackRequest(ip: string, pathname: string, userAgent: string) {
	const now = Date.now();
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

// ── Rate limiter (bots / unhuman only) ───────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_BOTS = 40; // per window per IP for good bots
const RATE_LIMIT_MAX_UNHUMAN = 60; // per window per IP for unhuman (non-browser) clients

function getClientIp(request: NextRequest): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");

	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? "unknown";
	}

	return realIp?.trim() ?? "unknown";
}

/**
 * Detects requests that don't look like they come from a real browser.
 * Real browsers always send Accept and Accept-Language headers.
 */
function isUnhuman(request: NextRequest): boolean {
	const accept = request.headers.get("accept") ?? "";
	const acceptLang = request.headers.get("accept-language") ?? "";
	// Browsers always send these; missing both strongly suggests a script/bot
	if (!accept && !acceptLang) return true;
	// Scripts often send accept: */* with nothing else useful
	if (accept === "*/*" && !acceptLang) return true;
	return false;
}

function isRateLimited(ip: string, limit: number): boolean {
	const now = Date.now();
	const current = rateLimitStore.get(ip);

	if (!current || current.resetAt <= now) {
		rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}

	if (current.count >= limit) {
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

	// Track IP for bot detection visibility
	trackRequest(ip, pathname, userAgent);

	// Block bad bots entirely
	if (isBot(userAgent)) {
		console.warn(`[IP-TRACKER] Blocked bad bot: ${ip} | UA: ${userAgent.slice(0, 80)}`);
		return new NextResponse("Forbidden", { status: 403 });
	}

	// Rate limit good bots and unhuman (non-browser) clients only.
	// Real human browser traffic is never rate-limited.
	const goodBot = isGoodBot(userAgent);
	const unhuman = !goodBot && isUnhuman(request);

	if (goodBot || unhuman) {
		const limit = goodBot ? RATE_LIMIT_MAX_BOTS : RATE_LIMIT_MAX_UNHUMAN;
		if (isRateLimited(ip, limit)) {
			console.warn(`[IP-TRACKER] Rate limited ${goodBot ? "good bot" : "unhuman"}: ${ip} | path: ${pathname} | UA: ${userAgent.slice(0, 60)}`);
			return new NextResponse("Too Many Requests", {
				status: 429,
				headers: {
					"Retry-After": "60",
				},
			});
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
