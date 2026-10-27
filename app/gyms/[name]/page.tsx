import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import GymContent from "@/app/components/GymContent";
import GymContentSkeleton from "@/app/components/GymContentSkeleton";
import { getDataFreshness, getGymMeta } from "@/lib/fetchData";
import StaleDataBanner from "@/app/components/StaleDataBanner";
import JsonLd from "@/app/components/JsonLd";

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gymName = decodeURIComponent((await params).name);

  try {
    const gym = await getGymMeta(gymName);
    if (!gym) {
      return { title: gymName };
    }

    const location = [gym.address, gym.state].filter(Boolean).join(", ");
    const title = `${gym.name} live member count`;
    const description = `How busy ${gym.name} is right now, plus today's count against its weekly average. ${location}.`;

    return {
      title,
      description,
      alternates: { canonical: `/gyms/${encodeURIComponent(gym.name)}` },
      openGraph: { title, description, url: `/gyms/${encodeURIComponent(gym.name)}` },
    };
  } catch {
    return { title: gymName };
  }
}

export default async function page({ params, searchParams }: PageProps) {
  const gymName = decodeURIComponent((await params).name);
  const selectedDate = (await searchParams)?.date;
  const [freshness, gymMeta] = await Promise.all([
    getDataFreshness(),
    getGymMeta(gymName),
  ]);

  const gymUrl = `https://revotracker.dvcklab.com/gyms/${encodeURIComponent(gymName)}`;

  // PocketBase stores the whole address in one field ("37 Ellen Stirling Blvd,
  // Innaloo WA 6018"), so split it rather than repeating the postcode.
  const [streetPart, localityPart] = (gymMeta?.address ?? "").split(",").map((part) => part.trim());
  const localityMatch = localityPart?.match(/^(.*?)\s+([A-Za-z]{2,3})\s+(\d{4})$/);

  return (
    <Card className="flex w-full flex-col border-0 px-5 pb-8 pt-2 sm:px-8 sm:pb-10 sm:pt-4">
      {gymMeta ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "HealthClub",
            name: `Revo Fitness ${gymMeta.name}`,
            url: gymUrl,
            address: {
              "@type": "PostalAddress",
              streetAddress: streetPart || gymMeta.address,
              ...(localityMatch
                ? {
                    addressLocality: localityMatch[1],
                    addressRegion: localityMatch[2],
                    postalCode: localityMatch[3],
                  }
                : {
                    addressRegion: gymMeta.state,
                    postalCode: String(gymMeta.postcode),
                  }),
              addressCountry: "AU",
            },
            ...(gymMeta.latitude != null && gymMeta.longitude != null
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: gymMeta.latitude,
                    longitude: gymMeta.longitude,
                  },
                }
              : {}),
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Squat racks",
              value: gymMeta.squatRacks,
            },
          }}
        />
      ) : null}

      <CardHeader className="mb-1 flex flex-col items-center gap-2 px-0 pb-0 pt-2 text-center font-bold text-2xl sm:pt-4">
        <h1>{gymName}</h1>
      </CardHeader>

      <StaleDataBanner freshness={freshness} className="mx-auto mb-4 w-full max-w-2xl" />

      <Suspense fallback={<GymContentSkeleton />}>
        <GymContent gymName={gymName} selectedDate={selectedDate} stale={freshness.stale} />
      </Suspense>
    </Card>
  );
}
