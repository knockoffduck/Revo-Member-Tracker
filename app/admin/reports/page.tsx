"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, FileText, AlertCircle, Wrench, CheckCircle2, Filter } from "lucide-react";
import { useBaseUrl, buildUrl } from "../components/base-url-context";
import { JsonViewer } from "../components/json-viewer";
import { BaseUrlSelector } from "../components/base-url-selector";
import { cn } from "@/lib/utils";

type ReportSummary = {
	gymsScanned: number;
	daysScanned: number;
	rowsInspected: number;
	suspiciousZerosFound: number;
	fixesProposed: number;
	fixesApplied: number;
	rowsSkipped: number;
};

type RepairProposal = {
	rowId: string;
	gymId: string;
	gymName: string;
	localTimestamp: string;
	originalCount: number;
	repairedCount: number;
	originalRatio: number;
	repairedRatio: number;
	originalPercentage: number;
	repairedPercentage: number;
	anomalyScore: number;
	confidence: "high" | "medium" | "low";
	repairMethod: string;
	reason?: string;
};

type ReportFile = {
	filename: string;
	generatedAt: string;
	mode: "dry-run" | "apply";
	summary: ReportSummary;
	proposalCount: number;
};

type FullReport = ReportFile & { proposals: RepairProposal[] };

export default function ReportsPage() {
	const { baseUrl } = useBaseUrl();
	const [reports, setReports] = useState<ReportFile[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [full, setFull] = useState<FullReport | null>(null);
	const [loadingList, setLoadingList] = useState(false);
	const [loadingFull, setLoadingFull] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confidenceFilter, setConfidenceFilter] = useState<"all" | "high" | "medium" | "low">("all");
	const [search, setSearch] = useState("");

	const fetchList = async () => {
		setLoadingList(true);
		setError(null);
		try {
			const res = await fetch(buildUrl(baseUrl, "/admin/logs/reports"));
				if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				const json = await res.json();
				const data = (json?.data ?? json) as ReportFile[];
				setReports(data);
				if (data.length > 0 && !selected) setSelected(data[0].filename);
			} catch (e) {
				setError(`${(e as Error).message}\nURL: ${buildUrl(baseUrl, "/admin/logs/reports")}`);
		} finally {
			setLoadingList(false);
		}
	};

	const fetchOne = async (filename: string) => {
		setLoadingFull(true);
		setError(null);
		try {
			const res = await fetch(buildUrl(baseUrl, `/admin/logs/reports/${encodeURIComponent(filename)}`));
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setFull((json?.data ?? json) as FullReport);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoadingFull(false);
		}
	};

	useEffect(() => {
		fetchList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [baseUrl]);

	useEffect(() => {
		if (selected) fetchOne(selected);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected]);

	const filteredProposals = (full?.proposals ?? []).filter((p) => {
		if (confidenceFilter !== "all" && p.confidence !== confidenceFilter) return false;
		if (search && !p.gymName.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	});

	return (
		<div className="space-y-6">
			<BaseUrlSelector />
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Stat Audit Reports</h1>
				<p className="text-sm text-muted-foreground">
					Repair reports from <code>bun run audit:dropouts</code> — files in <code>reports/</code>.
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div>
							<CardTitle>Reports</CardTitle>
							<CardDescription>{reports.length} report file(s) found.</CardDescription>
						</div>
						<Button size="sm" variant="outline" onClick={fetchList} disabled={loadingList} className="gap-1">
							{loadingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-3">
							{error}
						</div>
					)}
					{reports.length === 0 && !loadingList && !error && (
						<p className="text-sm text-muted-foreground italic">
							No reports yet. Run the Stat Audit script from the Diagnostics page.
						</p>
					)}
					<div className="flex flex-wrap gap-2">
						{reports.map((r) => (
							<button
								key={r.filename}
								onClick={() => setSelected(r.filename)}
								className={cn(
									"rounded-md border px-3 py-2 text-left text-xs font-mono",
									selected === r.filename
										? "border-primary bg-primary/10"
										: "hover:bg-muted/40",
								)}
							>
								<div className="flex items-center gap-2 font-semibold">
									<FileText className="h-3 w-3" />
									{r.filename}
								</div>
								<div className="text-muted-foreground">
									{r.generatedAt} · {r.mode} · {r.proposalCount} proposal(s)
								</div>
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			{full && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3 flex-wrap">
							<div>
								<CardTitle>{full.filename}</CardTitle>
								<CardDescription>
									Generated {full.generatedAt} · mode <Badge variant="outline">{full.mode}</Badge>
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<SummaryStat icon={Filter} label="Gyms scanned" value={full.summary.gymsScanned} />
							<SummaryStat icon={AlertCircle} label="Suspicious zeros" value={full.summary.suspiciousZerosFound} />
							<SummaryStat
								icon={Wrench}
								label="Fixes proposed"
								value={full.summary.fixesProposed}
								highlight
							/>
							<SummaryStat
								icon={CheckCircle2}
								label="Fixes applied"
								value={full.summary.fixesApplied}
								success={full.summary.fixesApplied > 0}
							/>
						</div>

						<div className="flex items-center gap-2 flex-wrap">
							<select
								value={confidenceFilter}
								onChange={(e) => setConfidenceFilter(e.target.value as typeof confidenceFilter)}
								className="h-8 rounded-md border bg-background px-2 text-xs"
							>
								<option value="all">All confidence</option>
								<option value="high">High</option>
								<option value="medium">Medium</option>
								<option value="low">Low</option>
							</select>
							<input
								placeholder="Filter gym name..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-8 rounded-md border bg-background px-2 text-xs w-48"
							/>
							<Badge variant="outline" className="font-mono">
								{filteredProposals.length} / {full.proposals.length}
							</Badge>
						</div>

						{loadingFull ? (
							<p className="text-sm text-muted-foreground italic">Loading report...</p>
						) : filteredProposals.length === 0 ? (
							<p className="text-sm text-muted-foreground italic">No proposals match the filters.</p>
						) : (
							<div className="rounded-md border overflow-hidden">
								<table className="w-full text-xs">
									<thead className="bg-muted/40 text-muted-foreground">
										<tr>
											<th className="text-left font-medium px-3 py-2">Gym</th>
											<th className="text-left font-medium px-3 py-2">Timestamp</th>
											<th className="text-right font-medium px-3 py-2">Score</th>
											<th className="text-right font-medium px-3 py-2">Original</th>
											<th className="text-right font-medium px-3 py-2">Repaired</th>
											<th className="text-left font-medium px-3 py-2">Method</th>
											<th className="text-left font-medium px-3 py-2">Confidence</th>
										</tr>
									</thead>
									<tbody>
										{filteredProposals.map((p) => (
											<tr key={p.rowId} className="border-t hover:bg-muted/20">
												<td className="px-3 py-1.5 font-medium">{p.gymName}</td>
												<td className="px-3 py-1.5 font-mono text-muted-foreground">{p.localTimestamp}</td>
												<td className="px-3 py-1.5 text-right font-mono">
													<Badge variant={p.anomalyScore > 60 ? "destructive" : "secondary"}>
														{p.anomalyScore.toFixed(1)}
													</Badge>
												</td>
												<td className="px-3 py-1.5 text-right font-mono">
													{p.originalCount} ({p.originalPercentage.toFixed(2)}%)
												</td>
												<td className="px-3 py-1.5 text-right font-mono text-green-600 dark:text-green-400">
													{p.repairedCount} ({p.repairedPercentage.toFixed(2)}%)
												</td>
												<td className="px-3 py-1.5 font-mono text-muted-foreground">{p.repairMethod}</td>
												<td className="px-3 py-1.5">
													<Badge
														variant={
															p.confidence === "high"
																? "default"
																: p.confidence === "medium"
																	? "secondary"
																	: "outline"
														}
													>
														{p.confidence}
													</Badge>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						<details className="mt-3">
							<summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
								Show raw JSON
							</summary>
							<div className="mt-2">
								<JsonViewer data={full} maxHeight="400px" />
							</div>
						</details>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function SummaryStat({
	icon: Icon,
	label,
	value,
	highlight,
	success,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: number;
	highlight?: boolean;
	success?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-md border p-3",
				highlight && "border-primary/40 bg-primary/5",
				success && "border-green-500/30 bg-green-500/5",
			)}
		>
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<Icon className="h-3.5 w-3.5" />
				{label}
			</div>
			<div className="text-2xl font-bold font-mono mt-1">{value.toLocaleString()}</div>
		</div>
	);
}
