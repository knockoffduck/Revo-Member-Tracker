import { requireAdminSession } from "@/lib/authz";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN ?? "";

function getAllowedBaseUrls(): string[] {
	const raw = process.env.ADMIN_API_URLS ?? process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:3001";
	return raw
		.split(",")
		.map((s) => s.trim().replace(/\/+$/, ""))
		.filter(Boolean);
}

function normalizeBaseUrl(url: string): string {
	return url.trim().replace(/\/+$/, "");
}

async function proxyRequest(request: NextRequest) {
	try {
		await requireAdminSession();
	} catch {
		return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);

	const rawPath = searchParams.get("path");
	const rawBaseUrl = searchParams.get("baseUrl");

	if (!rawPath) {
		return NextResponse.json({ success: false, error: "Missing path" }, { status: 400 });
	}

	const allowed = getAllowedBaseUrls();
	const baseUrl = normalizeBaseUrl(rawBaseUrl ?? allowed[0] ?? "");

	if (!allowed.includes(baseUrl)) {
		return NextResponse.json({ success: false, error: "Invalid base URL" }, { status: 400 });
	}

	const pathWithQuery = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
	const targetUrl = new URL(pathWithQuery, `${baseUrl}/`);

	// Forward any remaining query params except our proxy control params
	for (const [key, value] of searchParams.entries()) {
		if (key !== "path" && key !== "baseUrl") {
			targetUrl.searchParams.set(key, value);
		}
	}

	const upstreamHeaders = new Headers();
	const accept = request.headers.get("accept");
	if (accept) upstreamHeaders.set("Accept", accept);
	const contentType = request.headers.get("content-type");
	if (contentType) upstreamHeaders.set("Content-Type", contentType);
	if (ADMIN_API_TOKEN) upstreamHeaders.set("Authorization", `Bearer ${ADMIN_API_TOKEN}`);

	const wantsSse = accept?.includes("text/event-stream") ?? false;

	let body: BodyInit | undefined;
	if (request.method !== "GET" && request.method !== "HEAD") {
		body = await request.arrayBuffer();
	}

	const upstream = await fetch(targetUrl.toString(), {
		method: request.method,
		headers: upstreamHeaders,
		body,
	});

	// For SSE we want to stream the response without buffering
	if (wantsSse && upstream.body) {
		return new Response(upstream.body, {
			status: upstream.status,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	}

	return new Response(upstream.body, {
		status: upstream.status,
		headers: {
			"Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
		},
	});
}

export async function GET(request: NextRequest) {
	return proxyRequest(request);
}

export async function POST(request: NextRequest) {
	return proxyRequest(request);
}
