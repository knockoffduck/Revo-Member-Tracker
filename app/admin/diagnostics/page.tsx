"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiCallCard } from "../components/api-call-card";
import { ScriptRunnerCard, type ScriptDef } from "../components/script-runner-card";
import { BaseUrlSelector } from "../components/base-url-selector";
import { useApiCall } from "../components/use-api-call";

const SCRIPTS: ScriptDef[] = [
	{
		id: "generate-cookies",
		title: "Generate Cookies",
		description: "Runs Scraper/generate_cookies.ts to refresh the rotating cookie jar (10 PHP-serialized member cookies).",
		endpoint: "/admin/scripts/generate-cookies",
		confirmRequired: true,
	},
	{
		id: "test-cookies",
		title: "Test Cookies",
		description: "Validates each cookie via a different proxy against the club-counter endpoint. Reports which are broken.",
		endpoint: "/admin/scripts/test-cookies",
	},
	{
		id: "audit",
		title: "Stat Audit (dropout repair)",
		description: "Detects suspicious zero-occupancy readings and repairs them via interpolation or trend-based estimation.",
		endpoint: "/admin/scripts/audit",
		confirmRequired: true,
		options: [
			{ key: "apply", label: "Apply repairs (otherwise dry-run)", type: "boolean", default: false },
			{ key: "gym", label: "Gym filter", type: "string", placeholder: 'e.g. "Cannington"' },
			{ key: "from", label: "From date", type: "string", placeholder: "YYYY-MM-DD" },
			{ key: "to", label: "To date", type: "string", placeholder: "YYYY-MM-DD" },
			{ key: "minScore", label: "Min score", type: "number", default: 30 },
			{ key: "confidence", label: "Confidence (high|medium|all)", type: "string", default: "high" },
			{ key: "verbose", label: "Verbose", type: "boolean", default: false },
		],
	},
];

function HealthCard() {
	const c = useApiCall("/", { method: "GET" });
	return (
		<ApiCallCard
			title="Health Check"
			description="Quick liveness check — returns 'API Home'."
			endpoint="/"
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function UpdateGymsCard() {
	const c = useApiCall("/gyms/update", { method: "GET", streamSse: true });
	return (
		<ApiCallCard
			title="Update Gym Metadata"
			description="Fetches current counts, enriches with squat rack data, upserts gym metadata."
			endpoint="/gyms/update"
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function StatsUpdateCard() {
	const c = useApiCall("/gyms/stats/update", { method: "GET", streamSse: true });
	return (
		<ApiCallCard
			title="Full Stats Update (scrape + insert)"
			description="Full scrape: fetches counts, upserts metadata, inserts one snapshot row per gym (including 0-count for missing gyms). Writes to logs/updated_stats.json."
			endpoint="/gyms/stats/update"
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function LatestStatsCard() {
	const c = useApiCall("/admin/gyms/stats/latest-stream", { method: "GET", streamSse: true });
	return (
		<ApiCallCard
			title="Latest Stats Snapshot"
			description="Returns the most recent snapshot for all gyms, ordered by percentage desc. Streams progress via SSE."
			endpoint="/admin/gyms/stats/latest-stream"
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function GenerateTrendsCard() {
	const [lookback, setLookback] = useState<number>(90);
	const c = useApiCall("/admin/gyms/trends/generate-stream", {
		method: "POST",
		body: { lookback },
		streamSse: true,
	});
	return (
		<ApiCallCard
			title="Generate Trends (background)"
			description="Runs the trend agent to pre-compute popular-times data. Streams progress per gym."
			endpoint={`/admin/gyms/trends/generate-stream?lookback=${lookback}`}
			controls={
				<div className="flex items-center gap-2 max-w-xs">
					<Label htmlFor="lookback" className="text-xs whitespace-nowrap">
						Lookback (days)
					</Label>
					<Input
						id="lookback"
						type="number"
						min={1}
						max={365}
						value={lookback}
						onChange={(e) => setLookback(Math.max(1, Number(e.target.value) || 90))}
						className="h-8 text-xs font-mono"
					/>
				</div>
			}
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function AllTrendsCard() {
	const c = useApiCall("/gyms/trends", { method: "GET" });
	return (
		<ApiCallCard
			title="All Gym Trends (cached)"
			description="Returns cached trend data for all gyms as a { gymId: [...] } map."
			endpoint="/gyms/trends"
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

function GymTrendCard() {
	const [gymId, setGymId] = useState<string>("");
	const c = useApiCall(`/gyms/trends/${gymId || "unknown"}`, {
		method: "GET",
		query: undefined,
	});
	return (
		<ApiCallCard
			title="Single Gym Trends (cached)"
			description="Returns cached trend data for a specific gymId (7 day objects, 96 slots each)."
			endpoint={`/gyms/trends/${gymId || "{gymId}"}`}
			controls={
				<div className="flex items-center gap-2 max-w-md">
					<Label htmlFor="trend-gymid" className="text-xs whitespace-nowrap">
						gymId
					</Label>
					<Input
						id="trend-gymid"
						type="text"
						value={gymId}
						onChange={(e) => setGymId(e.target.value)}
						placeholder="e.g. 18830991 (24-bit hash)"
						className="h-8 text-xs font-mono"
					/>
				</div>
			}
			status={c.status}
			elapsedMs={c.elapsedMs}
			progress={c.progress}
			logs={c.logs}
			response={c.response}
			errorMessage={c.errorMessage}
			httpStatus={c.httpStatus}
			onRun={c.start}
			onCancel={c.cancel}
			onReset={c.reset}
		/>
	);
}

export default function DiagnosticsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Diagnostics</h1>
				<p className="text-sm text-muted-foreground">
					Execute API endpoints against the Revo Tracker backend and watch progress in real time.
				</p>
			</div>

			<BaseUrlSelector />

			<Card>
				<CardHeader>
					<CardTitle>Health & Live Data</CardTitle>
					<CardDescription>Quick checks against the running backend.</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4">
					<HealthCard />
					<LatestStatsCard />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Scraping & Updates</CardTitle>
					<CardDescription>
						These endpoints hit the Revo portal through the proxy and write to the database.
						Real-time phase + log streaming is enabled.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4">
					<UpdateGymsCard />
					<StatsUpdateCard />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Trends</CardTitle>
					<CardDescription>
						Trend generation runs in the background. The generate-stream endpoint streams per-gym progress.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4">
					<GenerateTrendsCard />
					<AllTrendsCard />
					<GymTrendCard />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Maintenance Scripts</CardTitle>
					<CardDescription>
						Run CLI scripts via the API. Output is streamed live and the final JSON result (if any) is shown.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4">
					{SCRIPTS.map((s) => (
						<ScriptRunnerCard key={s.id} script={s} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
