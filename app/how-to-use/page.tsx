import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, Activity } from "lucide-react";

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
                        We analyze this number against the gym's specific capacity to determine how "full" it feels.
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

        {/* Color Code Guide */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2">What do the Colors Mean?</h2>
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                        <CardTitle className="text-green-600">Green: Low</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        The gym is quiet. Plenty of equipment available. Perfect time for a workout.
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                        <CardTitle className="text-yellow-600">Yellow: Medium</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        Moderate traffic. You might wait for a bench or rack, but it's manageable.
                    </CardContent>
                </Card>
                 <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-600">Red: High</CardTitle>
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
                <br/>
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
