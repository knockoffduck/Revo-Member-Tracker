"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/darkmode";

export default function MobileNav() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden">
					<Menu className="h-6 w-6" />
					<span className="sr-only">Toggle menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[200px] ml-4 mt-2">
				<DropdownMenuItem asChild>
					<Link href="/gyms" className="w-full cursor-pointer">
						App
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/about" className="w-full cursor-pointer">
						About
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/how-to-use" className="w-full cursor-pointer">
						How to Use
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<div className="p-2 flex justify-between items-center">
					<span className="text-sm pl-2">Theme</span>
					<ModeToggle />
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
