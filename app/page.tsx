import Link from "next/link";
import { ArrowRight, Clock, Heart, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGyms } from "@/lib/fetchData";
import { getCrowdLevelMeta } from "./components/CrowdLevelBadge";
import type { Gym } from "./gyms/_types";

// The hero is only as useful as the numbers in it, so it is rendered per request.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let busiest: Gym[] = [];
  let totalGyms = 0;

  try {
    const response = await getGyms(undefined, { key: "percentage", direction: "desc" }, true);
    totalGyms = response.data.length;
    busiest = [...response.data]
      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
      .slice(0, 3);
  } catch (error) {
    console.error("[home] could not load live counts:", error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex flex-col items-center px-6 pb-12 pt-16 text-center sm:pt-24">
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Track the crowd, so you can focus on your gains
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
          Live member counts for every Revo Fitness location, so you can pick a
          quiet hour instead of guessing.
        </p>

        <form action="/gyms" className="mt-8 flex w-full max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="query"
              placeholder="Search a suburb"
              aria-label="Search gyms"
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-5">
            Search
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/gyms"
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Browse all {totalGyms > 0 ? totalGyms : ""} gyms
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link
            href="https://revofitness.com.au"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Revo Fitness website
          </Link>
        </div>
      </section>

      {busiest.length > 0 ? (
        <section className="mx-auto w-full max-w-3xl px-6 pb-16">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Busiest right now
            </h2>
            <Link
              href="/gyms"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              See all
            </Link>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {busiest.map((gym) => {
              const percentage = Math.round(gym.percentage ?? 0);
              const crowd = getCrowdLevelMeta(percentage);
              return (
                <li key={gym.id}>
                  <Link
                    href={`/gyms/${gym.gymName}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{gym.gymName}</p>
                      <p className="text-xs text-muted-foreground">
                        {gym.state} · {gym.count} members
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-secondary sm:block">
                        <div
                          className={`h-full ${percentage > 70 ? "bg-red-500" : percentage > 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        />
                      </div>
                      <span className={`w-16 text-right text-sm font-medium tabular-nums ${crowd.textClasses}`}>
                        {percentage}%
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-medium text-foreground">Peak times</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Each gym page charts today against its own weekly average, so
              quiet hours are easy to spot.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Heart className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-medium text-foreground">Favourites</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Save the gyms you actually use. They stay on this device, or sync
              if you sign in.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-medium text-foreground">Squat racks</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Rack counts and members per rack, so leg day doesn&apos;t start
              with a queue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
