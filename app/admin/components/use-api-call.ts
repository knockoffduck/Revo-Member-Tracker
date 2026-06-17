"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildUrl, useBaseUrl } from "./base-url-context";

export type ApiCallStatus = "idle" | "running" | "success" | "error" | "cancelled";

export type LogEvent = {
	level: "info" | "warn" | "error" | "success" | "debug";
	stage?: string;
	message: string;
	timestamp?: string;
};

export type ProgressInfo = {
	phase?: string;
	current?: number;
	total?: number;
	percent?: number;
	message?: string;
};

type UseApiCallOptions = {
	method?: "GET" | "POST";
	body?: unknown;
	query?: Record<string, string | number | undefined>;
	streamSse?: boolean;
};

type UseApiCallReturn = {
	status: ApiCallStatus;
	elapsedMs: number;
	progress: ProgressInfo | null;
	logs: LogEvent[];
	response: unknown;
	errorMessage: string | null;
	httpStatus: number | null;
	start: () => void;
	cancel: () => void;
	reset: () => void;
};

const initialState = {
	status: "idle" as ApiCallStatus,
	elapsedMs: 0,
	progress: null as ProgressInfo | null,
	logs: [] as LogEvent[],
	response: null as unknown,
	errorMessage: null as string | null,
	httpStatus: null as number | null,
};

export function useApiCall(path: string, options: UseApiCallOptions = {}): UseApiCallReturn {
	const { baseUrl, token } = useBaseUrl();
	const [state, setState] = useState(initialState);
	const [elapsedMs, setElapsedMs] = useState(0);
	const startTsRef = useRef<number | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pathRef = useRef(path);
	const optionsRef = useRef(options);

	pathRef.current = path;
	optionsRef.current = options;

	const stopTicker = useCallback(() => {
		if (tickRef.current) {
			clearInterval(tickRef.current);
			tickRef.current = null;
		}
	}, []);

	const startTicker = useCallback(() => {
		stopTicker();
		tickRef.current = setInterval(() => {
			if (startTsRef.current != null) {
				setElapsedMs(Date.now() - startTsRef.current);
			}
		}, 100);
	}, [stopTicker]);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		stopTicker();
		startTsRef.current = null;
		setElapsedMs(0);
		setState(initialState);
	}, [stopTicker]);

	const cancel = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		stopTicker();
		setState((prev) => ({ ...prev, status: "cancelled" }));
	}, [stopTicker]);

	const start = useCallback(async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		startTsRef.current = Date.now();
		setElapsedMs(0);
		setState({ ...initialState, status: "running" });
		startTicker();

		const url = buildUrl(baseUrl, pathRef.current, optionsRef.current.query);

		try {
			if (optionsRef.current.streamSse) {
				await runSse({
					url,
					method: optionsRef.current.method ?? "GET",
					body: optionsRef.current.body,
					signal: controller.signal,
					token,
					setState,
				});
			} else {
				await runFetch({
					url,
					method: optionsRef.current.method ?? "GET",
					body: optionsRef.current.body,
					signal: controller.signal,
					token,
					setState,
				});
			}
		} catch (err) {
			if ((err as Error).name === "AbortError") {
				setState((prev) => (prev.status === "cancelled" ? prev : { ...prev, status: "cancelled" }));
			} else {
				setState((prev) => ({
					...prev,
					status: "error",
					errorMessage: (err as Error).message ?? String(err),
				}));
			}
		} finally {
			stopTicker();
			if (startTsRef.current != null) {
				setElapsedMs(Date.now() - startTsRef.current);
			}
		}
	}, [baseUrl, token, startTicker, stopTicker]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			stopTicker();
		};
	}, [stopTicker]);

	return {
		status: state.status,
		elapsedMs,
		progress: state.progress,
		logs: state.logs,
		response: state.response,
		errorMessage: state.errorMessage,
		httpStatus: state.httpStatus,
		start,
		cancel,
		reset,
	};
}

async function runFetch(args: {
	url: string;
	method: string;
	body: unknown;
	signal: AbortSignal;
	token: string;
	setState: React.Dispatch<React.SetStateAction<typeof initialState>>;
}) {
	const headers: Record<string, string> = {};
	if (args.body) headers["Content-Type"] = "application/json";
	if (args.token) headers["Authorization"] = `Bearer ${args.token}`;
	const init: RequestInit = {
		method: args.method,
		signal: args.signal,
		headers,
		body: args.body ? JSON.stringify(args.body) : undefined,
	};
	const res = await fetch(args.url, init);
	const text = await res.text();
	let parsed: unknown = text;
	try {
		parsed = JSON.parse(text);
	} catch {
		// keep text
	}
	args.setState((prev) => ({
		...prev,
		httpStatus: res.status,
		response: parsed,
		status: res.ok ? "success" : "error",
		errorMessage: res.ok ? null : `HTTP ${res.status}: ${res.statusText || "request failed"}`,
	}));
}

async function runSse(args: {
	url: string;
	method: string;
	body: unknown;
	signal: AbortSignal;
	token: string;
	setState: React.Dispatch<React.SetStateAction<typeof initialState>>;
}) {
	const headers: Record<string, string> = { Accept: "text/event-stream" };
	if (args.token) headers["Authorization"] = `Bearer ${args.token}`;
	const init: RequestInit = {
		method: args.method,
		signal: args.signal,
		headers,
	};
	const res = await fetch(args.url, init);
	if (!res.ok || !res.body) {
		const text = await res.text().catch(() => "");
		args.setState((prev) => ({
			...prev,
			httpStatus: res.status,
			status: "error",
			errorMessage: `HTTP ${res.status}: ${text || res.statusText}`,
		}));
		return;
	}
	args.setState((prev) => ({ ...prev, httpStatus: res.status }));

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let finalResult: unknown = null;
	let finalStatus: ApiCallStatus = "success";
	let finalError: string | null = null;

	// signal cancellation to reader
	args.signal.addEventListener("abort", () => reader.cancel());

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		let idx;
		while ((idx = buffer.indexOf("\n\n")) !== -1) {
			const raw = buffer.slice(0, idx);
			buffer = buffer.slice(idx + 2);
			const event = parseSseEvent(raw);
			if (!event) continue;
			handleSseEvent(event, args.setState, {
				setResult: (r) => (finalResult = r),
				setStatus: (s) => (finalStatus = s),
				setError: (e) => (finalError = e),
			});
		}
	}

	args.setState((prev) => ({
		...prev,
		response: finalResult ?? prev.response,
		status: finalStatus,
		errorMessage: finalError,
	}));
}

type SseEvent = { event?: string; data: string; id?: string };

function parseSseEvent(raw: string): SseEvent | null {
	if (!raw.trim()) return null;
	const lines = raw.split("\n");
	const out: SseEvent = { data: "" };
	for (const line of lines) {
		if (line.startsWith(":")) continue; // comment
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const field = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trimStart();
		if (field === "event") out.event = value;
		else if (field === "data") out.data = out.data ? out.data + "\n" + value : value;
		else if (field === "id") out.id = value;
	}
	return out.data ? out : null;
}

function handleSseEvent(
	event: SseEvent,
	setState: React.Dispatch<React.SetStateAction<typeof initialState>>,
	refs: { setResult: (v: unknown) => void; setStatus: (s: ApiCallStatus) => void; setError: (e: string | null) => void },
) {
	let payload: { type: string; [k: string]: unknown };
	try {
		payload = JSON.parse(event.data);
	} catch {
		payload = { type: "log", level: "info", message: event.data };
	}

	switch (payload.type) {
		case "progress": {
			setState((prev) => ({
				...prev,
				progress: {
					phase: (payload.phase as string) ?? prev.progress?.phase,
					current: (payload.current as number) ?? prev.progress?.current,
					total: (payload.total as number) ?? prev.progress?.total,
					percent: (payload.percent as number) ?? prev.progress?.percent,
					message: (payload.message as string) ?? prev.progress?.message,
				},
			}));
			break;
		}
		case "log": {
			setState((prev) => ({
				...prev,
				logs: [
					...prev.logs,
					{
						level: (payload.level as LogEvent["level"]) ?? "info",
						stage: payload.stage as string | undefined,
						message: (payload.message as string) ?? "",
						timestamp: (payload.timestamp as string) ?? new Date().toISOString(),
					},
				].slice(-1000),
			}));
			break;
		}
		case "result": {
			refs.setResult(payload.data);
			break;
		}
		case "error": {
			refs.setStatus("error");
			refs.setError((payload.message as string) ?? "Stream error");
			break;
		}
		case "done": {
			refs.setStatus("success");
			break;
		}
		default: {
			// Treat unknown events as logs
			const log: LogEvent = { level: "info", message: event.data, timestamp: new Date().toISOString() };
			setState((prev) => ({
				...prev,
				logs: [...prev.logs, log].slice(-1000),
			}));
		}
	}
}
