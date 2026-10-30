"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "refreshing" | "done";

/**
 * Manual refresh for a page whose data can be served from a cache.
 *
 * Two caches sit between the reader and PocketBase: the service worker's page
 * cache and the 60 second in-process snapshot cache. `router.refresh()` handles
 * the first (RSC requests skip the worker); the POST busts the second, so the
 * numbers actually move instead of showing last minute's reading.
 */
export default function RefreshButton({
  className,
  label = "Refresh",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const busy = status === "refreshing";

  const onClick = useCallback(async () => {
    if (busy) return;
    setStatus("refreshing");

    try {
      await fetch("/api/refresh", { method: "POST", cache: "no-store" });
    } catch {
      // Offline or blocked: router.refresh() below still re-renders with
      // whatever the server last knew, which is better than nothing.
    }

    router.refresh();

    // Keep the spinner up just long enough to read as an action, then confirm.
    timers.current.push(
      setTimeout(() => {
        setStatus("done");
        timers.current.push(setTimeout(() => setStatus("idle"), 1600));
      }, 550),
    );
  }, [busy, router]);

  const text = busy ? "Refreshing" : status === "done" ? "Updated" : label;

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label={busy ? "Refreshing data" : "Refresh data"}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors",
          "hover:bg-muted/50 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-default disabled:opacity-80",
          className,
        )}
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", busy && "animate-spin")}
          aria-hidden="true"
        />
        <span>{text}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {busy ? "Refreshing" : status === "done" ? "Updated" : ""}
      </span>
    </>
  );
}
