import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        We can&apos;t find that page
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be out of date. The full list of Revo locations, with live
        counts, is one tap away.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/gyms">Browse gyms</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
