import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// =============================================================
// Support form handler.
//
// POST /api/support -> validate -> anti-spam checks -> Resend.
// JSON in, JSON out for the fetch() path; a form-encoded POST (no JS)
// gets a 303 back to /support?sent=1.
//
// Env:
//   RESEND_API_KEY  required
//   SUPPORT_TO      optional  default ddarm4@gmail.com
//   SUPPORT_FROM    optional  default Revo Tracker <support@revotracker.dvcklab.com>
//                              (the domain must be verified in Resend)
// =============================================================

const DEFAULT_TO = "ddarm4@gmail.com";
const DEFAULT_FROM = "Revo Tracker <support@revotracker.dvcklab.com>";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const MIN_FILL_MS = 1500;

const rateBuckets = new Map<string, number[]>();

const payloadSchema = z.object({
	name: z.string().trim().min(1, "Please tell us your name.").max(100),
	email: z.string().trim().email("Please enter a valid email address.").max(254),
	subject: z.string().trim().min(1, "Please add a subject.").max(200),
	message: z
		.string()
		.trim()
		.min(1, "Please describe the issue.")
		.max(5000, "That message is too long."),
	_honey: z.string().optional(),
	_elapsed: z.coerce.number().optional(),
});

type Payload = z.infer<typeof payloadSchema>;

type ParseResult = { ok: true; payload: Payload } | { ok: false; message: string };

function rateLimited(ip: string): boolean {
	const now = Date.now();
	const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (hits.length >= RATE_MAX) {
		rateBuckets.set(ip, hits);
		return true;
	}
	hits.push(now);
	rateBuckets.set(ip, hits);
	return false;
}

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(char) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
	);
}

function displayName(value: string): string {
	return value.replace(/[<>"\r\n\\]/g, " ").replace(/\s+/g, " ").trim() || "Revo Tracker user";
}

function isJsonRequest(request: Request): boolean {
	return (request.headers.get("content-type") ?? "").includes("application/json");
}

function fail(request: Request, message: string, status: number) {
	return isJsonRequest(request)
		? NextResponse.json({ error: message }, { status })
		: NextResponse.redirect(new URL("/support?error=1", request.url), 303);
}

async function readPayload(request: Request): Promise<ParseResult> {
	const type = request.headers.get("content-type") ?? "";
	try {
		const raw = type.includes("application/json")
			? await request.json()
			: Object.fromEntries((await request.formData()).entries());

		const parsed = payloadSchema.safeParse(raw);
		if (!parsed.success) {
			return {
				ok: false,
				message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
			};
		}
		return { ok: true, payload: parsed.data };
	} catch {
		return { ok: false, message: "We could not read that submission. Please try again." };
	}
}

async function sendViaResend(payload: Payload): Promise<{ ok: true; id: string } | { ok: false; status: number; detail: string }> {
	const baseUrl = (process.env.RESEND_BASE_URL ?? "https://api.resend.com").replace(/\/$/, "");
	const to = process.env.SUPPORT_TO?.trim() || DEFAULT_TO;
	const from = process.env.SUPPORT_FROM?.trim() || DEFAULT_FROM;

	const rows: Array<[string, string]> = [
		["Name", payload.name],
		["Email", payload.email],
		["Subject", payload.subject],
	];

	const text = [
		...rows.map(([label, value]) => `${label}: ${value}`),
		"",
		payload.message,
		"",
		"---",
		"Sent from revotracker.dvcklab.com/support",
	].join("\n");

	const html = `
		<div style="background:#f7f7f8;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#111827">
			<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
				<div style="padding:24px 28px;border-bottom:1px solid #e5e7eb">
					<p style="margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280">
						Revo Tracker — support
					</p>
					<h1 style="margin:8px 0 0;font-size:22px;line-height:1.25">${escapeHtml(payload.subject)}</h1>
				</div>
				<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
					${rows
						.map(
							([label, value]) => `
						<tr>
							<th scope="row" style="text-align:left;padding:12px 28px;width:96px;font-size:11px;
								letter-spacing:.12em;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #f3f4f6;
								font-weight:600;vertical-align:top">${label}</th>
							<td style="padding:12px 28px;border-bottom:1px solid #f3f4f6">${
								label === "Email"
									? `<a href="mailto:${escapeHtml(value)}" style="color:#4f46e5">${escapeHtml(value)}</a>`
									: escapeHtml(value)
							}</td>
						</tr>`,
						)
						.join("")}
				</table>
				<div style="padding:22px 28px">
					<div style="white-space:pre-wrap;line-height:1.6;font-size:15px">${escapeHtml(payload.message)}</div>
				</div>
				<div style="padding:14px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
					Reply to this email to answer ${escapeHtml(payload.name)} directly.
				</div>
			</div>
		</div>
	`;

	const response = await fetch(`${baseUrl}/emails`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to: [to],
			reply_to: `${displayName(payload.name)} <${payload.email}>`,
			subject: `[Revo Tracker] ${displayName(payload.subject)}`,
			text,
			html,
		}),
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		return { ok: false, status: response.status, detail };
	}

	const data = (await response.json()) as { id: string };
	return { ok: true, id: data.id };
}

export async function POST(request: Request) {
	if (!process.env.RESEND_API_KEY) {
		console.error("support: RESEND_API_KEY is not configured");
		return fail(request, "This form is not configured yet. Please email support@revotracker.dvcklab.com.", 500);
	}

	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"unknown";

	if (rateLimited(ip)) {
		return fail(request, "Too many messages. Please try again in a few minutes.", 429);
	}

	const parsed = await readPayload(request);
	if (!parsed.ok) {
		return fail(request, parsed.message, 400);
	}
	const payload = parsed.payload;

	// Honeypot + time trap: accept silently so bots do not learn they were caught.
	if (payload._honey?.trim() || (payload._elapsed ?? 0) < MIN_FILL_MS) {
		return isJsonRequest(request)
			? NextResponse.json({ success: true })
			: NextResponse.redirect(new URL("/support?sent=1", request.url), 303);
	}

	const result = await sendViaResend(payload);

	if (!result.ok) {
		console.error("support: Resend send failed", result.status, result.detail);
		return fail(request, "We could not send your message. Please email support@revotracker.dvcklab.com.", 502);
	}

	console.log("support: sent", result.id, "from", payload.email, "ip", ip);

	return isJsonRequest(request)
		? NextResponse.json({ success: true, id: result.id })
		: NextResponse.redirect(new URL("/support?sent=1", request.url), 303);
}

export async function GET() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
