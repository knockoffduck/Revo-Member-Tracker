import { NextResponse, type NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
	if (shouldRedirectToHttps(request)) {
		const secureUrl = request.nextUrl.clone();
		secureUrl.protocol = "https:";
		return NextResponse.redirect(secureUrl, 301);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
