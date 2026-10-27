import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to use it",
  description:
    "How to read the crowd levels, the count chart and the squat rack numbers in Revo Tracker.",
  alternates: { canonical: "/how-to-use" },
  openGraph: {
    title: "How to use it",
    description:
      "How to read the crowd levels, the count chart and the squat rack numbers in Revo Tracker.",
    url: "/how-to-use",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "How to use Revo Tracker",
      },
    ],
  },
};

export default function HowToUsePage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="space-y-12">
                {/* Header */}
                <section className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">How to Use Revo Tracker</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        A quick guide to understanding our data and using the app effectively.
                    </p>
                </section>

                {/* The Card Explanation */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-2">Understanding the Gym Card</h2>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                Each card represents a Revo Fitness location. At a glance, you can see the <strong>Gym Name</strong> and the current real-time <strong>Occupancy</strong> (number of members present).
                            </p>
                            <p>
                                We analyse this number against the gym&apos;s specific capacity to determine how &quot;full&quot; it feels.
                            </p>
                        </div>
                        {/* Mock Card Visual */}
                        <Card className="w-full max-w-sm mx-auto shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Revo Example Gym</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">45 Members</div>
                                <p className="text-xs text-muted-foreground">Updated just now</p>
                                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-[45%]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Colour Code Guide */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-2">What do the Colours Mean?</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-emerald-500/30 bg-emerald-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                    Quiet: under 30%
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                The gym is quiet. Plenty of equipment available. Perfect time for a workout.
                            </CardContent>
                        </Card>
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                                    Moderate: 30 to 70%
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                Moderate traffic. You might wait for a bench or rack, but it&apos;s manageable.
                            </CardContent>
                        </Card>
                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                                    Busy: over 70%
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                Very busy. Expect crowds and waiting times. Maybe save leg day for later.
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Interactivity Guide */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
                        <MousePointerClick className="w-6 h-6" />
                        Go Deeper
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Want to plan ahead? <strong>Click on any gym card</strong> to view detailed historical charts.
                        <br />
                        We track occupancy trends over time, allowing you to see which days and hours are typically the busiest for your specific location.
                    </p>
                </section>

                <div className="flex justify-center pt-8">
                    <Link href="/gyms">
                        <Button size="lg">Find a Gym</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
