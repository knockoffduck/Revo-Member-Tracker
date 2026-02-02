"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { startTransition } from "react";
import { MdAccountCircle } from "react-icons/md";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

export default function AccountButton() {

	const router = useRouter();

	const { data: session } = authClient.useSession();

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/auth/sign-in");
					router.refresh();
				},
			},
		});
	};

	const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon">
						<MdAccountCircle size={32}></MdAccountCircle>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<div className="flex flex-col px-2 py-1.5 gap-1">
						<span className="text-sm font-medium">{session?.user?.name}</span>
						<span className="text-xs text-muted-foreground">{session?.user?.email}</span>
						{isAdmin && (
							<span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mt-1 w-fit">
								Admin
							</span>
						)}
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Link href="/account">My Account</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={handleSignOut}
						className="cursor-pointer"
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
