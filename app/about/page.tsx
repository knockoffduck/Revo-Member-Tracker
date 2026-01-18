import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info, BarChart, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="space-y-12">
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">About Revo Member Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering your fitness journey with real-time data and smarter insights.
          </p>
        </section>

        {/* Mission / Context */}
        <section className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" />
              The Problem
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Revo Fitness provides a live member count on their website, which is great. However, a raw number can be misleading.
              <br /><br />
              Is 50 people a lot? In a massive warehouse gym, probably not. But in a smaller studio? It might be packed. Context matters.
            </p>
          </div>
          <div className="bg-muted/50 p-8 rounded-lg border">
            <h3 className="font-semibold mb-2">Did You Know?</h3>
            <p className="text-sm text-muted-foreground">
              Peak times aren't just about the hour of the day. They fluctuate based on location size, equipment availability, and even the weather. We help you see the bigger picture.
            </p>
          </div>
        </section>

        {/* Solution / Calculation */}
        <section className="space-y-4">
           <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart className="w-6 h-6 text-primary" />
              Our Intelligent Approach
            </h2>
          <p className="text-muted-foreground leading-relaxed">
            Revo Member Tracker doesn't just scrape numbers; it contextualizes them. We calculate the <strong>Occupancy Ratio</strong> based on the specific capacity of each gym location.
          </p>
          <ul className="grid gap-4 md:grid-cols-3 mt-6">
             <li className="p-4 rounded-md bg-card border shadow-sm">
                <span className="block text-2xl font-bold text-primary mb-1">Raw Data</span>
                <span className="text-sm text-muted-foreground">Official member count from Revo.</span>
             </li>
             <li className="p-4 rounded-md bg-card border shadow-sm">
                <span className="block text-2xl font-bold text-primary mb-1">Capacity</span>
                <span className="text-sm text-muted-foreground">Gym-specific size limits.</span>
             </li>
             <li className="p-4 rounded-md bg-card border shadow-sm">
                <span className="block text-2xl font-bold text-primary mb-1">Fullness %</span>
                <span className="text-sm text-muted-foreground">True context for your workout.</span>
             </li>
          </ul>
        </section>

        {/* Account Features */}
        <section className="space-y-4">
           <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Your Personal Tracker
            </h2>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account, you unlock personalized features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong>Favorites List:</strong> Save your local gyms for quick access.</li>
            <li><strong>Historical Trends:</strong> (Coming Soon) See past data to predict future crowds.</li>
            <li><strong>Cross-Device Sync:</strong> Your preferences follow you everywhere.</li>
          </ul>
        </section>
        
        <div className="flex justify-center pt-8">
           <Link href="/gyms">
            <Button size="lg">Start Tracking Now</Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
