"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "revo-admin:base-url";
const DEFAULT_BASE_URL =
	process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";

type BaseUrlContextValue = {
	baseUrl: string;
	setBaseUrl: (url: string) => void;
	resetBaseUrl: () => void;
};

const BaseUrlContext = createContext<BaseUrlContextValue | null>(null);

export function BaseUrlProvider({ children }: { children: ReactNode }) {
	const [baseUrl, setBaseUrlState] = useState<string>(DEFAULT_BASE_URL);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored) setBaseUrlState(stored);
		} catch {
			// ignore (SSR or storage disabled)
		}
		setHydrated(true);
	}, []);

	const setBaseUrl = useCallback((url: string) => {
		const trimmed = url.trim().replace(/\/+$/, "");
		setBaseUrlState(trimmed);
		try {
			window.localStorage.setItem(STORAGE_KEY, trimmed);
		} catch {
			// ignore
		}
	}, []);

	const resetBaseUrl = useCallback(() => {
		setBaseUrlState(DEFAULT_BASE_URL);
		try {
			window.localStorage.removeItem(STORAGE_KEY);
		} catch {
			// ignore
		}
	}, []);

	return (
		<BaseUrlContext.Provider value={{ baseUrl, setBaseUrl, resetBaseUrl }}>
			{children}
		</BaseUrlContext.Provider>
	);
}

export function useBaseUrl() {
	const ctx = useContext(BaseUrlContext);
	if (!ctx) throw new Error("useBaseUrl must be used within BaseUrlProvider");
	return ctx;
}

export function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | undefined>) {
	const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null && value !== "") {
				url.searchParams.set(key, String(value));
			}
		}
	}
	return url.toString();
}

export function buildProxyUrl(
	baseUrl: string,
	path: string,
	query?: Record<string, string | number | undefined>,
): string {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const pathUrl = new URL(normalizedPath, "http://localhost");
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined && value !== null && value !== "") {
				pathUrl.searchParams.set(key, String(value));
			}
		}
	}
	const targetPath = `${pathUrl.pathname}${pathUrl.search}`;
	return buildUrl(window.location.origin, "/api/admin/proxy", {
		baseUrl,
		path: targetPath,
	});
}
