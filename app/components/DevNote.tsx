"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DevNoteProps {
    className?: string;
    variant?: "compact" | "full";
}

export function DevNote({ className, variant = "full" }: DevNoteProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="h-[1px] w-4 bg-border/50" />
                Dev Note
                <span className="h-[1px] w-4 bg-border/50" />
            </div>
            <p
                className={cn(
                    "text-muted-foreground leading-relaxed text-center font-medium",
                    variant === "compact" ? "text-xs max-w-xs" : "text-sm max-w-md"
                )}
            >
                This app is 100% ad-free and maintained by{" "}
                <Link
                    href="https://dvcklab.com"
                    target="_blank"
                    className="text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary"
                >
                    Dvcklab
                </Link>
                . We build high-performance tools for the Perth community. Need something custom?{" "}
                <Link
                    href="https://dvcklab.com"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-primary hover:underline group"
                >
                    Let&apos;s chat
                    <ExternalLink className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
            </p>
        </div>
    );
}
