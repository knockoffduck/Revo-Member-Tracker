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
import { signOut } from "../auth/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountButton() {
	const router = useRouter();
	const handleClickSignOutButton = () => {
		startTransition(async () => {
			const { errorMessage } = await signOut();
			if (errorMessage) {
				toast.error(errorMessage);
			} else {
				router.push("/");
				toast.success("Successfully signed out");
			}
		});
	};
	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon">
						<MdAccountCircle size={32}></MdAccountCircle>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Link href="/account/gyms">My Gyms</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={handleClickSignOutButton}
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
