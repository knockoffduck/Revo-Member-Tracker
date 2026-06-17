"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "revo-admin:base-url";
const TOKEN_KEY = "revo-admin:token";
const DEFAULT_BASE_URL =
	process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";

type BaseUrlContextValue = {
	baseUrl: string;
	setBaseUrl: (url: string) => void;
	resetBaseUrl: () => void;
	token: string;
	setToken: (token: string) => void;
	resetToken: () => void;
};

const BaseUrlContext = createContext<BaseUrlContextValue | null>(null);

export function BaseUrlProvider({ children }: { children: ReactNode }) {
	const [baseUrl, setBaseUrlState] = useState<string>(DEFAULT_BASE_URL);
	const [token, setTokenState] = useState<string>("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored) setBaseUrlState(stored);
			const storedToken = window.localStorage.getItem(TOKEN_KEY);
			if (storedToken) setTokenState(storedToken);
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

	const setToken = useCallback((value: string) => {
		const trimmed = value.trim();
		setTokenState(trimmed);
		try {
			if (trimmed) window.localStorage.setItem(TOKEN_KEY, trimmed);
			else window.localStorage.removeItem(TOKEN_KEY);
		} catch {
			// ignore
		}
	}, []);

	const resetToken = useCallback(() => {
		setTokenState("");
		try {
			window.localStorage.removeItem(TOKEN_KEY);
		} catch {
			// ignore
		}
	}, []);

	return (
		<BaseUrlContext.Provider value={{ baseUrl, setBaseUrl, resetBaseUrl, token, setToken, resetToken }}>
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
