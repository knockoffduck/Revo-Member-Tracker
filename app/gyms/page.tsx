import { getGyms } from "@/lib/fetchData";
import GymList from "./GymList";
import { GymResponse } from "./_types";
import { getCurrentUser } from "@/lib/current-user";

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

    return (
        <div className="w-full px-8 justify-center pt-6 gap-6 ">
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
                    />
                ) : (
                    <p>Loading gyms...</p>
                )}
            </div>
        </div>
    );
}
