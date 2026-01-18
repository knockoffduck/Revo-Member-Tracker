import { ModeToggle } from "@/components/ui/darkmode";
import Link from "next/link";
import NextImage from "next/image";
import SignOutButton from "./SignOutButton";
import SignInButton from "./SignInButton";
import AccountButton from "./AccountButton";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import MobileNav from "./MobileNav";

export default async function Header() {
	const session = await auth.api.getSession({
		headers: await headers()
	});


	return (
		<div className="relative flex pt-8 justify-center w-full">
			{/* Logo with Link */}
			<Link href="/" className="text-4xl font-bold mb-6 text-center">
				<NextImage
					src="/RevoTracker-logo.svg"
					alt="Revo Tracker Logo"
					width={400}
					height={30}
					className="text-center h-[30px] w-[130px] md:w-[400px] object-contain"
					priority
				/>
			</Link>

			{/* Mobile Menu - Visible on mobile only */}
			<div className="absolute top-8 left-4 z-50 md:hidden">
				<MobileNav />
			</div>

			{/* Dark mode toggle - Visible on desktop only */}
			<div className="hidden md:block absolute top-8 left-8 z-50">
				<ModeToggle />
			</div>

            {/* Navigation Links - Visible on desktop only */}
            <div className="hidden md:flex absolute top-8 left-24 z-50 gap-2"> 
                <Link href="/gyms">
                    <Button variant="ghost">App</Button>
                </Link>
                <Link href="/about">
                    <Button variant="ghost">About</Button>
                </Link>
                <Link href="/how-to-use">
                    <Button variant="ghost">How to Use</Button>
                </Link>
            </div>

			{/* Account/Sign in button - always visible */}
			<div className="absolute top-8 right-8 z-50">
				{session ? (
					<AccountButton></AccountButton>
				) : (
					<Link href="/auth/sign-in">
						<Button variant="outline">Sign In</Button>
					</Link>
				)}
				{/* Sign out button - only visible when signed in */}
			</div>
		</div>
	);
}
