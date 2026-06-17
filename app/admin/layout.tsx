import { isAdmin } from "@/lib/updates";
import { redirect } from "next/navigation";
import { BaseUrlProvider } from "./components/base-url-context";
import { AdminSidebar } from "./components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	// DEV BYPASS: remove this guard for production
	const admin = process.env.NODE_ENV === "development" ? true : await isAdmin();
	if (!admin) {
		redirect("/?admin=forbidden");
	}
	return (
		<BaseUrlProvider>
			<div className="flex flex-col md:flex-row min-h-[calc(100vh-160px)] px-4 md:px-8 py-4 md:py-8 gap-4 md:gap-8">
				<AdminSidebar />
				<div className="flex-1 min-w-0 space-y-6">{children}</div>
			</div>
		</BaseUrlProvider>
	);
}
