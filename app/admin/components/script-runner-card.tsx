"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, RotateCcw, CheckCircle2, XCircle, AlertCircle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBaseUrl, buildUrl } from "./base-url-context";
import { JsonViewer } from "./json-viewer";

export type ScriptOption = {
	key: string;
	label: string;
	type: "boolean" | "string" | "number";
	default?: boolean | string | number;
	placeholder?: string;
	description?: string;
};

export type ScriptDef = {
	id: string;
	title: string;
	description: string;
	endpoint: string;
	options?: ScriptOption[];
	confirmRequired?: boolean;
};

type JobStatus = "idle" | "starting" | "running" | "success" | "error" | "cancelled";

type LogLine = {
	level: "info" | "warn" | "error" | "success" | "debug" | "stdout" | "stderr";
	stage?: string;
	message: string;
	timestamp: string;
};

export function ScriptRunnerCard({ script }: { script: ScriptDef }) {
	const { baseUrl } = useBaseUrl();
	const [status, setStatus] = useState<JobStatus>("idle");
	const [elapsedMs, setElapsedMs] = useState(0);
	const [logs, setLogs] = useState<LogLine[]>([]);
	const [result, setResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);
	const [opts, setOpts] = useState<Record<string, string | number | boolean>>(() => {
		const init: Record<string, string | number | boolean> = {};
		for (const o of script.options ?? []) {
			if (o.default !== undefined) init[o.key] = o.default;
		}
		return init;
	});
	const [showSettings, setShowSettings] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const startTsRef = useRef<number | null>(null);
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (logRef.current) {
			logRef.current.scrollTop = logRef.current.scrollHeight;
		}
	}, [logs]);

	const stopTicker = () => {
		if (tickRef.current) {
			clearInterval(tickRef.current);
			tickRef.current = null;
		}
	};

	const startTicker = () => {
		stopTicker();
		tickRef.current = setInterval(() => {
			if (startTsRef.current != null) setElapsedMs(Date.now() - startTsRef.current);
		}, 100);
	};

	const onRun = async () => {
		if (script.confirmRequired && !window.confirm(`Run "${script.title}"? This may take a while.`)) {
			return;
		}
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		startTsRef.current = Date.now();
		setElapsedMs(0);
		setStatus("starting");
		setError(null);
		setResult(null);
		setLogs([]);
		startTicker();

		const url = buildUrl(baseUrl, script.endpoint);

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
				body: JSON.stringify({ options: opts }),
				signal: controller.signal,
			});
			if (!res.ok || !res.body) {
				const text = await res.text().catch(() => "");
				setStatus("error");
				setError(`HTTP ${res.status}: ${text || res.statusText}`);
				return;
			}
			setStatus("running");
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let finalResult: unknown = null;
			controller.signal.addEventListener("abort", () => reader.cancel());

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				let idx;
				while ((idx = buffer.indexOf("\n\n")) !== -1) {
					const raw = buffer.slice(0, idx);
					buffer = buffer.slice(idx + 2);
					const ev = parseSse(raw);
					if (!ev) continue;
					const data = ev.data;
					try {
						const payload = JSON.parse(data);
						if (payload.type === "log") {
							setLogs((prev) =>
								[
									...prev,
									{
										level: (payload.level as LogLine["level"]) ?? "info",
										stage: payload.stage,
										message: payload.message ?? "",
										timestamp: payload.timestamp ?? new Date().toISOString(),
									},
								].slice(-2000),
							);
						} else if (payload.type === "result") {
							finalResult = payload.data;
						} else if (payload.type === "error") {
							setStatus("error");
							setError(payload.message ?? "Script error");
						} else if (payload.type === "done") {
							// will be set by SSE close
						} else {
							const line: LogLine = { level: "info", message: data, timestamp: new Date().toISOString() };
							setLogs((prev) => [...prev, line].slice(-2000));
						}
					} catch {
						const line: LogLine = { level: "stdout", message: data, timestamp: new Date().toISOString() };
						setLogs((prev) => [...prev, line].slice(-2000));
					}
				}
			}
			setResult(finalResult);
			setStatus((prev) => (prev === "error" || prev === "cancelled" ? prev : "success"));
		} catch (err) {
			if ((err as Error).name === "AbortError") {
				setStatus((prev) => (prev === "cancelled" ? prev : "cancelled"));
			} else {
				setStatus("error");
				setError((err as Error).message ?? String(err));
			}
		} finally {
			stopTicker();
			if (startTsRef.current != null) setElapsedMs(Date.now() - startTsRef.current);
		}
	};

	const onCancel = () => {
		abortRef.current?.abort();
		setStatus("cancelled");
	};

	const onReset = () => {
		abortRef.current?.abort();
		setStatus("idle");
		setElapsedMs(0);
		setLogs([]);
		setResult(null);
		setError(null);
	};

	const statusBadge = (() => {
		switch (status) {
			case "starting":
			case "running":
				return (
					<Badge variant="secondary" className="gap-1">
						<Loader2 className="h-3 w-3 animate-spin" /> {status === "starting" ? "Starting" : "Running"}
					</Badge>
				);
			case "success":
				return (
					<Badge className="gap-1 bg-green-600">
						<CheckCircle2 className="h-3 w-3" /> Success
					</Badge>
				);
			case "error":
				return (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="h-3 w-3" /> Error
					</Badge>
				);
			case "cancelled":
				return (
					<Badge variant="outline" className="gap-1">
						<AlertCircle className="h-3 w-3" /> Cancelled
					</Badge>
				);
			default:
				return <Badge variant="outline">Idle</Badge>;
		}
	})();

	return (
		<div className="rounded-xl border bg-card text-card-foreground shadow-sm">
			<div className="flex flex-col gap-3 p-5 border-b">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1 flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-semibold text-base leading-none">{script.title}</h3>
							{statusBadge}
							<Badge variant="outline" className="font-mono text-[10px]">POST {script.endpoint}</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{script.description}</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{(script.options?.length ?? 0) > 0 && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setShowSettings((v) => !v)}
								className="gap-1"
							>
								<Settings2 className="h-3.5 w-3.5" />
							</Button>
						)}
						<Button
							size="sm"
							onClick={onRun}
							disabled={status === "running" || status === "starting"}
							className="gap-1"
						>
							<Play className="h-3.5 w-3.5" />
							Run
						</Button>
						{(status === "running" || status === "starting") && (
							<Button size="sm" variant="destructive" onClick={onCancel} className="gap-1">
								<Square className="h-3.5 w-3.5" />
								Cancel
							</Button>
						)}
						{(status === "success" || status === "error" || status === "cancelled") && (
							<Button size="sm" variant="ghost" onClick={onReset} className="gap-1">
								<RotateCcw className="h-3.5 w-3.5" />
								Reset
							</Button>
						)}
					</div>
				</div>

				{showSettings && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3">
						{(script.options ?? []).map((o) => (
							<div key={o.key} className="space-y-1">
								<label className="text-xs font-medium flex items-center justify-between">
									<span>{o.label}</span>
									{o.type === "boolean" && (
										<input
											type="checkbox"
											checked={Boolean(opts[o.key])}
											onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })}
										/>
									)}
								</label>
								{o.type !== "boolean" && (
									<input
										type={o.type === "number" ? "number" : "text"}
										value={String(opts[o.key] ?? "")}
										placeholder={o.placeholder}
										onChange={(e) => {
											const raw = e.target.value;
											const value: string | number = o.type === "number" ? Number(raw) : raw;
											setOpts({ ...opts, [o.key]: value });
										}}
										className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
									/>
								)}
								{o.description && <p className="text-[10px] text-muted-foreground">{o.description}</p>}
							</div>
						))}
					</div>
				)}

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{status === "running" || status === "starting"
							? "Streaming live output..."
							: "Idle"}
					</span>
					<span className="font-mono">{formatElapsed(elapsedMs)}</span>
				</div>

				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{error}
					</div>
				)}
			</div>

			<div ref={logRef} className="bg-zinc-950 text-zinc-100 font-mono text-[11px] leading-snug p-3 max-h-80 overflow-y-auto">
				{logs.length === 0 ? (
					<p className="text-zinc-500 italic">No output yet. Click Run to start the script.</p>
				) : (
					logs.map((l, i) => (
						<div key={i} className="flex gap-2">
							<span className="text-zinc-500 shrink-0">{formatTime(l.timestamp)}</span>
							{l.stage && <span className="text-cyan-400 shrink-0">[{l.stage}]</span>}
							<span
								className={cn(
									l.level === "error" && "text-red-400",
									l.level === "warn" && "text-yellow-300",
									l.level === "success" && "text-green-400",
									l.level === "debug" && "text-zinc-400",
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

			{result != null && (
				<div className="p-5 border-t">
					<h4 className="text-xs font-medium text-muted-foreground mb-2">Result</h4>
					<JsonViewer data={result} maxHeight="240px" />
				</div>
			)}
		</div>
	);
}

function parseSse(raw: string): { data: string } | null {
	if (!raw.trim()) return null;
	const lines = raw.split("\n");
	let data = "";
	for (const line of lines) {
		if (line.startsWith(":")) continue;
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const field = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trimStart();
		if (field === "data") data = data ? data + "\n" + value : value;
	}
	return data ? { data } : null;
}

function formatTime(ts: string) {
	const d = new Date(ts);
	if (isNaN(d.getTime())) return ts;
	return d.toLocaleTimeString("en-GB", { hour12: false });
}

function formatElapsed(ms: number) {
	if (ms < 1000) return `${ms}ms`;
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}.${Math.floor((ms % 1000) / 100)}s`;
	const m = Math.floor(s / 60);
	return `${m}m ${s % 60}s`;
}
