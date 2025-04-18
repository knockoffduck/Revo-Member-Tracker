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

export default function AccountButton() {
	const router = useRouter();

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
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
