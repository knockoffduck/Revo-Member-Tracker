"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
	data: unknown;
	maxHeight?: string;
	className?: string;
};

export function JsonViewer({ data, maxHeight = "320px", className }: Props) {
	const [copied, setCopied] = useState(false);
	const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
	const isJson = typeof data !== "string";

	const onCopy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div className={cn("rounded-md border bg-muted/30 relative", className)}>
			<button
				type="button"
				onClick={onCopy}
				className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-background/80 border hover:bg-background"
			>
				{copied ? "Copied" : "Copy"}
			</button>
			<pre
				className={cn(
					"text-[11px] leading-snug font-mono p-3 overflow-auto",
					isJson ? "text-foreground" : "text-foreground whitespace-pre-wrap break-all",
				)}
				style={{ maxHeight }}
			>
				{isJson ? <HighlightedJson json={text} /> : text}
			</pre>
		</div>
	);
}

function HighlightedJson({ json }: { json: string }) {
	const parts: { text: string; cls: string }[] = [];
	const regex = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
	let lastIdx = 0;
	let m: RegExpExecArray | null;
	while ((m = regex.exec(json)) !== null) {
		if (m.index > lastIdx) parts.push({ text: json.slice(lastIdx, m.index), cls: "" });
		if (m[1] !== undefined) {
			parts.push({ text: m[1], cls: m[2] ? "text-sky-400" : "text-emerald-400" });
		} else if (m[3] !== undefined) {
			parts.push({ text: m[3], cls: "text-amber-400" });
		} else if (m[4] !== undefined) {
			parts.push({ text: m[4], cls: "text-violet-400" });
		}
		lastIdx = m.index + m[0].length;
	}
	if (lastIdx < json.length) parts.push({ text: json.slice(lastIdx), cls: "" });
	return (
		<>
			{parts.map((p, i) => (
				<span key={i} className={p.cls}>
					{p.text}
				</span>
			))}
		</>
	);
}
