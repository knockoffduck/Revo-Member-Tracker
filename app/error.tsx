"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] render error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Something went wrong on our side
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        The live counter didn&apos;t answer in time. This is usually brief, so
        trying again normally clears it.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/gyms">Browse gyms</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
