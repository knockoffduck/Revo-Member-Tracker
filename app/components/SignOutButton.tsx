"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "../auth/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

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
		<Button onClick={handleClickSignOutButton} disabled={isPending}>
			Sign Out
		</Button>
	);
}
