import { getGyms } from "@/lib/fetchData"; // Assuming getGyms is here
import SearchGyms from "./SearchGyms"; // Corrected import path assumption
import GymList from "./GymList"; // Corrected import path assumption
import { GymResponse } from "./_types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userHasGymPreferences } from "./actions";

/**
 * The main page component for the Revo Member Tracker.
 * Displays a search bar and a list of gyms with their current occupancy.
 * Fetches gym data and user preferences server-side.
 * Handles loading and error states for data fetching.
 *
 * @param props - Component props.
 * @param props.params - URL parameters (dynamic route segments).
 * @param props.searchParams - URL search parameters, used for filtering gyms.
 */
// Updated HomePageProps to include params for better alignment with Next.js PageProps
interface HomePageProps {
  params: { [key: string]: string | string[] | undefined };
  searchParams?: {
    query?: string;
  };
}

// Using the updated HomePageProps in the function signature
export default async function Home({ params, searchParams }: HomePageProps) {
  // Extract search query, default to empty string if not present
  const query = searchParams?.query || "";

  let response: GymResponse | undefined = undefined;
  let fetchError: string | null = null;

  // --- User Session and Preferences ---
  const session = await auth.api.getSession({
    headers: await headers(), // Required for server-side session retrieval
  });
  const userId = session?.user?.id;
  // Check if the logged-in user has gym preferences set
  const preferences = userId ? await userHasGymPreferences(userId) : false;

  // --- Data Fetching ---
  try {
    // Fetch the latest gym occupancy data
    response = await getGyms();
  } catch (error) {
    console.error("Failed to fetch gyms:", error);
    // Set an error message to display to the user
    fetchError = "Could not load gym data. Please try again later.";
  }

  // --- Rendering ---
  return (
    <div className="w-full px-8 justify-center pt-6 gap-6 ">
      <div className="flex flex-col gap-6">
        {/* Search component */}
        <SearchGyms />

        {/* Conditional Rendering based on fetch status */}
        {fetchError ? (
          // Display error message if fetching failed
          <p className="text-red-500">{fetchError}</p>
        ) : response ? (
          // Display GymList if data was fetched successfully
          <GymList
            query={query} // Pass search query for filtering
            gymResponse={response} // Pass fetched gym data
            currentTime={response.timestamp} // Pass timestamp of the data
            hasGymPreferences={preferences} // Pass user preference status
          />
        ) : (
          // Display loading message while data is being fetched
          // TODO: Replace with a more sophisticated Skeleton UI?
          <p>Loading gyms...</p>
        )}
      </div>
    </div>
  );
}
