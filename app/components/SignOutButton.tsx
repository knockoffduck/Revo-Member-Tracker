"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/auth/sign-in"); // redirect to login page
					router.refresh(); // Refresh server components/data
				},
			},
		});

	}



	return (
		<Button onClick={handleSignOut}>
			Sign Out
		</Button>
	);
}
