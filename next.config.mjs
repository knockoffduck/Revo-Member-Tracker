const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'none'",
	"form-action 'self' https://formsubmit.co",
	"object-src 'none'",
	"script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
	"frame-src 'none'",
];

if (isProduction) {
	cspDirectives.push("upgrade-insecure-requests");
}

const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: cspDirectives.join("; "),
	},
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

if (isProduction) {
	securityHeaders.push({
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains; preload",
	});
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	poweredByHeader: false,
	reactStrictMode: true,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
