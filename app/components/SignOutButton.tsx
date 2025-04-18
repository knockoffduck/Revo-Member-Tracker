"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();


	return (
		<Button disabled={isPending}>
			Sign Out
		</Button>
	);
}
