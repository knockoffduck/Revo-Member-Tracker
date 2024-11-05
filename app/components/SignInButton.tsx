"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SignInButton() {
	const pathname = usePathname();
	const disabledButton = pathname === "/login" ? true : false;
	return (
		<Button asChild disabled={disabledButton}>
			<Link href="/login" className="w-full h-full">
				Sign In
			</Link>
		</Button>
	);
}
