"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, XCircle, AlertCircle, Square, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiCallStatus, LogEvent } from "./use-api-call";
import { JsonViewer } from "./json-viewer";

export type ApiCallCardProps = {
	title: string;
	description: string;
	endpoint: string;
	method?: "GET" | "POST";
	requiresStream?: boolean;
	controls?: React.ReactNode;
	// hook returns
	status: ApiCallStatus;
	elapsedMs: number;
	progress: { phase?: string; current?: number; total?: number; percent?: number; message?: string } | null;
	logs: LogEvent[];
	response: unknown;
	errorMessage: string | null;
	httpStatus: number | null;
	onRun: () => void;
	onCancel: () => void;
	onReset: () => void;
};

export function ApiCallCard({
	title,
	description,
	endpoint,
	method = "GET",
	controls,
	status,
	elapsedMs,
	progress,
	logs,
	response,
	errorMessage,
	httpStatus,
	onRun,
	onCancel,
	onReset,
}: ApiCallCardProps) {
	const [showLogs, setShowLogs] = useState(false);
	const [showResponse, setShowResponse] = useState(true);

	const statusBadge = useMemo(() => {
		switch (status) {
			case "running":
				return (
					<Badge variant="secondary" className="gap-1">
						<Loader2 className="h-3 w-3 animate-spin" /> Running
					</Badge>
				);
			case "success":
				return (
					<Badge variant="default" className="gap-1 bg-green-600">
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
	}, [status]);

	const percent = progress?.percent ?? (status === "running" ? undefined : status === "success" ? 100 : 0);
	const isIndeterminate = status === "running" && percent == null;
	const elapsedLabel = formatElapsed(elapsedMs);

	return (
		<div className="rounded-xl border bg-card text-card-foreground shadow-sm">
			<div className="flex flex-col gap-3 p-5 border-b">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1 flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-semibold text-base leading-none">{title}</h3>
							{statusBadge}
							{httpStatus != null && (
								<Badge variant="outline" className="font-mono text-[10px]">
									{httpStatus}
								</Badge>
							)}
						</div>
						<p className="text-sm text-muted-foreground">{description}</p>
						<code className="text-xs font-mono text-muted-foreground block truncate">
							{method} {endpoint}
						</code>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button
							size="sm"
							onClick={onRun}
							disabled={status === "running"}
							className="gap-1"
						>
							<Play className="h-3.5 w-3.5" />
							Run
						</Button>
						{status === "running" && (
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

				{controls}

				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span className="truncate">
							{progress?.phase ? <span className="font-medium text-foreground">{progress.phase}</span> : "Idle"}
							{progress?.message && <span className="ml-2">{progress.message}</span>}
						</span>
						<span className="font-mono">{elapsedLabel}</span>
					</div>
					<Progress
						value={isIndeterminate ? 50 : (percent ?? 0)}
						max={100}
						className={cn(isIndeterminate && "animate-pulse")}
						color={status === "error" ? "bg-red-600" : status === "success" ? "bg-green-600" : "bg-primary"}
					/>
					{progress?.current != null && progress?.total != null && (
						<p className="text-[10px] text-muted-foreground font-mono">
							{progress.current} / {progress.total}
						</p>
					)}
				</div>

				{errorMessage && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{errorMessage}
					</div>
				)}
			</div>

			{logs.length > 0 && (
				<div className="border-b">
					<button
						onClick={() => setShowLogs((v) => !v)}
						className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
					>
						<span>Live logs ({logs.length})</span>
						{showLogs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
					</button>
					{showLogs && (
						<div className="px-5 pb-4 max-h-72 overflow-y-auto">
							<LogStream logs={logs} />
						</div>
					)}
				</div>
			)}

			{response != null && (
				<div>
					<button
						onClick={() => setShowResponse((v) => !v)}
						className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
					>
						<span>Response</span>
						{showResponse ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
					</button>
					{showResponse && (
						<div className="px-5 pb-5">
							<JsonViewer data={response} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function LogStream({ logs }: { logs: LogEvent[] }) {
	return (
		<div className="rounded-md border bg-zinc-950 text-zinc-100 font-mono text-[11px] leading-snug p-3 space-y-0.5 max-h-64 overflow-y-auto">
			{logs.map((log, i) => (
				<div key={i} className="flex gap-2">
					<span className="text-zinc-500 shrink-0">{formatLogTime(log.timestamp)}</span>
					{log.stage && <span className="text-cyan-400 shrink-0">[{log.stage}]</span>}
					<span
						className={cn(
							log.level === "error" && "text-red-400",
							log.level === "warn" && "text-yellow-300",
							log.level === "success" && "text-green-400",
							log.level === "debug" && "text-zinc-400",
							(log.level === "info" || !log.level) && "text-zinc-100",
						)}
					>
						{log.message}
					</span>
				</div>
			))}
		</div>
	);
}

function formatLogTime(ts?: string) {
	if (!ts) return "";
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
