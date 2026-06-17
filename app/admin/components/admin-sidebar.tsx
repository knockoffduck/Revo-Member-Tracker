"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, LayoutDashboard, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/admin/diagnostics", label: "Diagnostics", icon: Activity },
	{ href: "/admin/logs", label: "Logs", icon: ScrollText },
	{ href: "/admin/reports", label: "Reports", icon: FileText },
];

export function AdminSidebar() {
	const pathname = usePathname();
	return (
		<aside className="w-full md:w-56 md:shrink-0 rounded-xl border bg-muted/20">
			<div className="p-4 space-y-1">
				<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
					<LayoutDashboard className="h-3.5 w-3.5" />
					Admin
				</div>
				<nav className="flex md:flex-col flex-row gap-1 overflow-x-auto">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
