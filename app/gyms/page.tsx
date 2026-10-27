import { getDataFreshness, getGyms } from "@/lib/fetchData";
import GymList from "./GymList";
import JsonLd from "@/app/components/JsonLd";
import { GymResponse } from "./_types";
import { getCurrentUser } from "@/lib/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "All gyms",
    description:
        "Live member counts and crowd levels for every Revo Fitness location, sorted by how busy they are right now.",
    alternates: { canonical: "/gyms" },
    openGraph: {
        title: "All gyms",
        description:
            "Live member counts and crowd levels for every Revo Fitness location, sorted by how busy they are right now.",
        url: "/gyms",
        images: [
            {
                url: "/opengraph-image",
                width: 1200,
                height: 630,
                alt: "All gyms: live member counts for every Revo Fitness location",
            },
        ],
    },
};

export default async function Home(props: {
    searchParams?: Promise<{ query?: string; sort?: string; order?: string; showAll?: string }>;
}) {
    const searchParams = await props.searchParams;

    const query = searchParams?.query || "";
    const sortKey = searchParams?.sort || "percentage";
    // Busiest gym first when no explicit order is requested.
    const sortDirection = (searchParams?.order as "asc" | "desc") || "desc";
    const showAll = searchParams?.showAll === "true";

    let response: GymResponse | undefined = undefined;
    let fetchError: string | null = null;

    // getCurrentUser() already loads gym preferences with the session, so derive
    // the flags from it instead of issuing two extra MySQL round-trips.
    const user = await getCurrentUser();
    const userId = user?.id;
    const userFavorites = user?.gymPreferences ?? [];
    const hasPreferences = userFavorites.length > 0;

    try {
        response = await getGyms(
            undefined,
            {
                key: sortKey,
                direction: sortDirection,
            },
            showAll,
        );
    } catch (error) {
        console.error("Failed to fetch gyms:", error);
        fetchError = "Could not load gym data. Please try again later.";
    }

    const freshness = await getDataFreshness();

    return (
        <div className="w-full px-8 justify-center pt-6 gap-6 ">
            {response && response.data.length > 0 ? (
                <JsonLd
                    data={{
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        name: "Revo Fitness gyms tracked by Revo Tracker",
                        numberOfItems: response.data.length,
                        itemListElement: response.data.map((gym, index) => ({
                            "@type": "ListItem",
                            position: index + 1,
                            name: gym.gymName,
                            url: `https://revotracker.dvcklab.com/gyms/${encodeURIComponent(gym.gymName)}`,
                        })),
                    }}
                />
            ) : null}
            <div className="flex flex-col gap-6">
                {fetchError ? (
                    <p className="text-red-500">{fetchError}</p>
                ) : response ? (
                    <GymList
                        hasGymPreferences={hasPreferences}
                        userFavorites={userFavorites}
                        isAuthenticated={!!userId}
                        query={query}
                        gymResponse={response}
                        currentTime={response.timestamp}
                        freshness={freshness}
                    />
                ) : (
                    <p>Loading gyms...</p>
                )}
            </div>
        </div>
    );
}
