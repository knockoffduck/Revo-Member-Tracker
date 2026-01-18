import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Clock, MapPin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 px-6 text-center md:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Track Your Gains, Not Crowds
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            Real-time capacity tracking for Revo Fitness gyms. Find the perfect time to train and avoid the rush.
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
              Analyze historical data to identify the quietest times to workout.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Multiple Locations</h3>
            <p className="text-muted-foreground">
              Track any Revo Fitness location. Save your favorites for quick access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
