import Link from "next/link";

import { DevNote } from "./DevNote";

export default function Footer() {
    return (
        <footer className="w-full py-12 px-4 border-t bg-muted/20 mt-auto">
            <div className="container mx-auto flex flex-col items-center gap-6">
                <DevNote variant="compact" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/support" className="transition-colors hover:text-foreground">
                        Support
                    </Link>
                    <a
                        href="mailto:dvcklab@outlook.com"
                        className="transition-colors hover:text-foreground"
                    >
                        dvcklab@outlook.com
                    </a>
                </div>
                <p className="text-[10px] text-muted-foreground/50 font-medium">
                    &copy; {new Date().getFullYear()} Dvcklab. Built for the Revo Fitness Community.
                </p>
            </div>
        </footer>
    );
}
