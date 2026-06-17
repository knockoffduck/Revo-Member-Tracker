"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pause, Play, RotateCcw, ScrollText, Search, Trash2 } from "lucide-react";
import { useBaseUrl, buildUrl } from "../components/base-url-context";
import { JsonViewer } from "../components/json-viewer";
import { BaseUrlSelector } from "../components/base-url-selector";
import { cn } from "@/lib/utils";

type ScrapeSession = {
	timestamp: string;
	gymCount: number;
	missingGyms: number;
	totalKnownGyms: number;
	data: Array<{ name: string; member_count: number; percentage: number; state?: string; postcode?: number; size?: number; member_ratio?: number }>;
};

type ServerLogLine = {
	level: "info" | "warn" | "error" | "success" | "debug" | "stdout" | "stderr";
	stage?: string;
	message: string;
	timestamp: string;
};

export default function LogsPage() {
	return (
		<div className="space-y-6">
			<BaseUrlSelector />
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Logs</h1>
				<p className="text-sm text-muted-foreground">
					Inspect the rolling scrape log and tail the API server&apos;s live output.
				</p>
			</div>

			<Tabs defaultValue="scrape">
				<TabsList>
					<TabsTrigger value="scrape">Scrape log</TabsTrigger>
					<TabsTrigger value="server">Server stream</TabsTrigger>
				</TabsList>
				<TabsContent value="scrape" className="space-y-4">
					<ScrapeLogView />
				</TabsContent>
				<TabsContent value="server" className="space-y-4">
					<ServerLogStream />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ScrapeLogView() {
	const { baseUrl } = useBaseUrl();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<ScrapeSession[]>([]);
	const [selected, setSelected] = useState<number | null>(null);
	const [search, setSearch] = useState("");

	const fetchLog = async () => {
		setLoading(true);
		setError(null);
		const url = buildUrl(baseUrl, "/admin/logs/scrape");
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			const json = await res.json();
			const data = (json?.data ?? json) as ScrapeSession[];
			setSessions(data);
			setSelected(0);
		} catch (e) {
			setError(`${(e as Error).message}\nURL: ${url}`);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLog();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [baseUrl]);

	const filtered = (sessions[selected ?? 0]?.data ?? []).filter((g) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return g.name.toLowerCase().includes(s) || g.state?.toLowerCase().includes(s);
	});

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div>
							<CardTitle>Rolling scrape log</CardTitle>
							<CardDescription>
								Backend file: <code>logs/updated_stats.json</code> — last {sessions.length} scrape session(s).
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button size="sm" variant="outline" onClick={fetchLog} disabled={loading} className="gap-1">
								{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
								Refresh
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
							{error}
						</div>
					)}
					{sessions.length === 0 && !loading && !error && (
						<p className="text-sm text-muted-foreground italic">No sessions found.</p>
					)}
					{sessions.length > 0 && (
						<div className="space-y-3">
							<div className="flex flex-wrap gap-2">
								{sessions.map((s, i) => (
									<button
										key={i}
										onClick={() => setSelected(i)}
										className={cn(
											"rounded-md border px-3 py-2 text-left text-xs font-mono",
											selected === i
												? "border-primary bg-primary/10"
												: "hover:bg-muted/40",
										)}
									>
										<div className="font-semibold">{s.timestamp}</div>
										<div className="text-muted-foreground">
											{s.gymCount} scraped · {s.missingGyms} missing · {s.totalKnownGyms} known
										</div>
									</button>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{sessions[selected ?? 0] && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3 flex-wrap">
							<div>
								<CardTitle>Session {sessions[selected ?? 0].timestamp}</CardTitle>
								<CardDescription>
									{sessions[selected ?? 0].gymCount} gyms scraped · {sessions[selected ?? 0].missingGyms} missing
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<div className="relative">
									<Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Filter gyms..."
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className="h-8 pl-7 w-48 text-xs"
									/>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border overflow-hidden">
							<table className="w-full text-xs">
								<thead className="bg-muted/40 text-muted-foreground">
									<tr>
										<th className="text-left font-medium px-3 py-2">Gym</th>
										<th className="text-left font-medium px-3 py-2">State</th>
										<th className="text-right font-medium px-3 py-2">Size (m²)</th>
										<th className="text-right font-medium px-3 py-2">Members</th>
										<th className="text-right font-medium px-3 py-2">%</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((g, i) => (
										<tr key={i} className="border-t hover:bg-muted/20">
											<td className="px-3 py-1.5 font-medium">{g.name}</td>
											<td className="px-3 py-1.5 text-muted-foreground">{g.state || "—"}</td>
											<td className="px-3 py-1.5 text-right font-mono">{g.size ?? 0}</td>
											<td className="px-3 py-1.5 text-right font-mono">
												<Badge variant={g.member_count === 0 ? "outline" : "secondary"}>
													{g.member_count}
												</Badge>
											</td>
											<td className="px-3 py-1.5 text-right font-mono">
												{g.percentage.toFixed(2)}%
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<details className="mt-3">
							<summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
								Show raw JSON
							</summary>
							<div className="mt-2">
								<JsonViewer data={sessions[selected ?? 0]} maxHeight="320px" />
							</div>
						</details>
					</CardContent>
				</Card>
			)}
		</>
	);
}

function ServerLogStream() {
	const { baseUrl } = useBaseUrl();
	const [lines, setLines] = useState<ServerLogLine[]>([]);
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<string>("");
	const abortRef = useRef<AbortController | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
	}, [lines]);

	const start = async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setError(null);
		setLines([]);
		setStreaming(true);
		try {
			const url = buildUrl(baseUrl, "/admin/logs/stream");
			const res = await fetch(url, {
				method: "GET",
				headers: { Accept: "text/event-stream" },
				signal: controller.signal,
			});
			if (!res.ok || !res.body) {
				const text = await res.text().catch(() => "");
				setError(`HTTP ${res.status}: ${text || res.statusText}`);
				setStreaming(false);
				return;
			}
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			controller.signal.addEventListener("abort", () => reader.cancel());

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				let idx;
				while ((idx = buffer.indexOf("\n\n")) !== -1) {
					const raw = buffer.slice(0, idx);
					buffer = buffer.slice(idx + 2);
					const data = extractData(raw);
					if (!data) continue;
					try {
						const payload = JSON.parse(data);
						const line: ServerLogLine = {
							level: payload.level ?? "stdout",
							stage: payload.stage,
							message: payload.message ?? data,
							timestamp: payload.timestamp ?? new Date().toISOString(),
						};
						setLines((prev) => [...prev, line].slice(-5000));
					} catch {
						const line: ServerLogLine = {
							level: "stdout",
							message: data,
							timestamp: new Date().toISOString(),
						};
						setLines((prev) => [...prev, line].slice(-5000));
					}
				}
			}
		} catch (e) {
			if ((e as Error).name !== "AbortError") {
				setError((e as Error).message);
			}
		} finally {
			setStreaming(false);
		}
	};

	const stop = () => {
		abortRef.current?.abort();
		setStreaming(false);
	};

	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	const filtered = filter
		? lines.filter((l) => (l.message + (l.stage ?? "")).toLowerCase().includes(filter.toLowerCase()))
		: lines;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<div>
						<CardTitle>
							<ScrollText className="h-4 w-4 inline mr-1" /> Server log stream
						</CardTitle>
						<CardDescription>
							Tail of the API server&apos;s stdout/stderr via SSE. Lines stream as they are emitted.
						</CardDescription>
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Input
							placeholder="Filter..."
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className="h-8 w-40 text-xs"
						/>
						{streaming ? (
							<Button size="sm" variant="destructive" onClick={stop} className="gap-1">
								<Pause className="h-3.5 w-3.5" /> Pause
							</Button>
						) : (
							<Button size="sm" onClick={start} className="gap-1">
								<Play className="h-3.5 w-3.5" /> Start
							</Button>
						)}
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setLines([])}
							disabled={lines.length === 0}
							className="gap-1"
						>
							<Trash2 className="h-3.5 w-3.5" /> Clear
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-3">
						{error}
					</div>
				)}
				<div className="flex items-center gap-2 mb-2">
					<Label className="text-xs">{lines.length} line(s)</Label>
					{streaming && (
						<Badge variant="secondary" className="gap-1">
							<Loader2 className="h-3 w-3 animate-spin" /> Live
						</Badge>
					)}
				</div>
				<div
					ref={logRef}
					className="rounded-md border bg-zinc-950 text-zinc-100 font-mono text-[11px] leading-snug p-3 max-h-[600px] overflow-y-auto"
				>
				{lines.length === 0 ? (
					<p className="text-zinc-500 italic">
						{streaming ? "Connected. Waiting for the next log event..." : "No lines yet. Click Start to begin streaming."}
					</p>
				) : (
						filtered.map((l, i) => (
							<div key={i} className="flex gap-2">
								<span className="text-zinc-500 shrink-0">{formatTime(l.timestamp)}</span>
								{l.stage && <span className="text-cyan-400 shrink-0">[{l.stage}]</span>}
								<span
									className={cn(
										l.level === "error" && "text-red-400",
										l.level === "warn" && "text-yellow-300",
										l.level === "success" && "text-green-400",
										l.level === "stderr" && "text-orange-300",
										(l.level === "info" || l.level === "stdout" || !l.level) && "text-zinc-100",
									)}
								>
									{l.message}
								</span>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function extractData(raw: string): string | null {
	if (!raw.trim()) return null;
	let data = "";
	for (const line of raw.split("\n")) {
		if (line.startsWith(":")) continue;
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const field = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trimStart();
		if (field === "data") data = data ? data + "\n" + value : value;
	}
	return data || null;
}

function formatTime(ts: string) {
	const d = new Date(ts);
	if (isNaN(d.getTime())) return ts;
	return d.toLocaleTimeString("en-GB", { hour12: false });
}
