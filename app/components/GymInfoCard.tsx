import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Ruler, ExternalLink } from "lucide-react";
import type { GymDetails } from "@/lib/fetchData";

interface GymInfoCardProps {
    details: GymDetails;
}

export default function GymInfoCard({ details }: GymInfoCardProps) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.address)}`;

    return (
        <Card className="mt-4">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Address and Size Info */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{details.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Ruler className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{details.areaSize.toLocaleString()} m²</span>
                    </div>
                </div>

                {/* Get Directions Button */}
                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        Get Directions
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
