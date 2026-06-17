"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
	value: string;
	setValue: (v: string) => void;
};
const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string) {
	const ctx = React.useContext(TabsContext);
	if (!ctx) throw new Error(`${component} must be used within <Tabs>`);
	return ctx;
}

type TabsProps = {
	defaultValue: string;
	value?: string;
	onValueChange?: (v: string) => void;
	className?: string;
	children: React.ReactNode;
};

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
	const [internal, setInternal] = React.useState(defaultValue);
	const current = value ?? internal;
	const setValue = (v: string) => {
		if (value === undefined) setInternal(v);
		onValueChange?.(v);
	};
	return (
		<TabsContext.Provider value={{ value: current, setValue }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
	return (
		<div
			role="tablist"
			className={cn(
				"inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	className,
	children,
}: {
	value: string;
	className?: string;
	children: React.ReactNode;
}) {
	const { value: current, setValue } = useTabs("TabsTrigger");
	const isActive = current === value;
	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			data-state={isActive ? "active" : "inactive"}
			onClick={() => setValue(value)}
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
				isActive ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	className,
	children,
}: {
	value: string;
	className?: string;
	children: React.ReactNode;
}) {
	const { value: current } = useTabs("TabsContent");
	if (current !== value) return null;
	return (
		<div
			role="tabpanel"
			data-state="active"
			className={cn("mt-4 ring-offset-background focus-visible:outline-none", className)}
		>
			{children}
		</div>
	);
}
