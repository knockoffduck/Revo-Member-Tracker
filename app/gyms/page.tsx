import { getGyms } from "@/lib/fetchData";
import GymList from "./GymList";
import { GymResponse } from "./_types";
import { getCurrentUser } from "@/lib/current-user";
import { userHasGymPreferences, getUserGymPreferences } from "@/app/actions";

export default async function Home(props: {
    searchParams?: Promise<{ query?: string; sort?: string; order?: string; showAll?: string }>;
}) {
    const searchParams = await props.searchParams;

    const query = searchParams?.query || "";
    const sortKey = searchParams?.sort || "percentage";
    const sortDirection = (searchParams?.order as "asc" | "desc") || "asc";
    const showAll = searchParams?.showAll === "true";

    let response: GymResponse | undefined = undefined;
    let fetchError: string | null = null;

    const user = await getCurrentUser();
    const userId = user?.id;
    const hasPreferences = userId ? await userHasGymPreferences(userId) : false;
    const userFavorites = userId ? await getUserGymPreferences(userId) : [];

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
