import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/darkmode";
import { getUser } from "@/utils/supabase/server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import SignInButton from "./SignInButton";

export default async function Header() {
	const user = await getUser();
	console.log(user?.email);
	return (
		<div className="flex pt-8 justify-center">
			<Link href="/" className="text-4xl font-bold mb-6 text-center">
				Revo Member Tracker
			</Link>
			<div className="absolute top-8 left-8 z-50">
				<ModeToggle></ModeToggle>
			</div>
			<div className="absolute top-8 right-8 z-50">
				{user && <SignOutButton></SignOutButton>}
				{!user && <SignInButton></SignInButton>}
			</div>
		</div>
	);
}
