import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Clock, MapPin } from "lucide-react";
import { DevNote } from "./components/DevNote";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 px-6 text-center md:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Track the crowd, so you can focus on your gains
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            Real-time capacity tracking to help you find the perfect time to train and avoid the rush.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/gyms">
            <Button size="lg" className="h-12 px-8 text-lg gap-2">
              Find Your Gym <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="https://revofitness.com.au" target="_blank" rel="noreferrer">
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
              Visit Revo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-24 px-6">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Live Capacity</h3>
            <p className="text-muted-foreground">
              See exactly how busy your gym is right now before you leave the house.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Peak Times</h3>
            <p className="text-muted-foreground">
              Analyse historical data to identify the quietest times to workout.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-2 bg-primary/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </div>
            <h3 className="text-xl font-bold">Favourites</h3>
            <p className="text-muted-foreground">
              Track any Revo Fitness location. Save your favourites for quick access.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
