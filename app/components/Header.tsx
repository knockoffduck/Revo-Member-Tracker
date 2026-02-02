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
		headers: await headers(),
	});

	return (
		<header className="w-full flex items-center justify-between py-6 px-4 md:px-8">
			{/* Left Section: Mobile Menu (Hidden on Desktop) & Desktop Nav (Hidden on Mobile) */}
			<div className="flex-1 flex justify-start items-center">
				{/* Mobile Menu Trigger */}
				<div className="md:hidden">
					<MobileNav />
				</div>

				{/* Desktop Navigation Links & Theme Toggle */}
				<div className="hidden md:flex items-center gap-2">
					<ModeToggle />
					<nav className="flex items-center gap-1 ml-4 justify-start">
						<Link href="/gyms">
							<Button variant="ghost">App</Button>
						</Link>
						<Link href="/updates">
							<Button variant="ghost">Updates</Button>
						</Link>
						<Link href="/about">
							<Button variant="ghost">About</Button>
						</Link>
						<Link href="/how-to-use">
							<Button variant="ghost">How to Use</Button>
						</Link>
					</nav>
				</div>
			</div>

			{/* Center Section: Logo */}
			<div className="flex-shrink-0 mx-4">
				<Link href="/" className="flex items-center justify-center">
					<NextImage
						src="/RevoTracker-logo.svg"
						alt="Revo Tracker Logo"
						width={400}
						height={30}
						className="h-[30px] w-[130px] md:w-[300px] lg:w-[400px] object-contain"
						priority
					/>
				</Link>
			</div>

			{/* Right Section: Auth Buttons */}
			<div className="flex-1 flex justify-end items-center">
				{session ? (
					<AccountButton />
				) : (
					<Link href="/auth/sign-in">
						<Button variant="outline">Sign In</Button>
					</Link>
				)}
			</div>
		</header>
	);
}
