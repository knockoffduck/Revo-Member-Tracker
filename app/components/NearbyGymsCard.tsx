import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";
import Link from "next/link";
import { getNearbyGyms, NearbyGym } from "@/lib/fetchData";
import CrowdLevelBadge from "./CrowdLevelBadge";

interface NearbyGymsCardProps {
    gymName: string;
}

/**
 * Displays a card showing nearby gyms that are less crowded.
 * Fetches gyms within 10km radius sorted by crowd level (ascending).
 */
export default async function NearbyGymsCard({ gymName }: NearbyGymsCardProps) {
    const nearbyGyms = await getNearbyGyms(gymName, 10, 5);

    // Don't render if no nearby gyms found
    if (nearbyGyms.length === 0) {
        return null;
    }

    return (
        <Card className="mt-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    Less Crowded Nearby
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {nearbyGyms.map((gym: NearbyGym) => (
                        <Link
                            key={gym.gymName}
                            href={`/gyms/${encodeURIComponent(gym.gymName)}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{gym.gymName}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {gym.distanceKm} km away
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CrowdLevelBadge percentage={gym.percentage} size="sm" />
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
