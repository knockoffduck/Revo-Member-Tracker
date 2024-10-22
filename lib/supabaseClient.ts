import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client only once and reuse it
const supabaseUrl = "https://database.daffydvck.live";
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
	throw new Error(
		"Supabase key is undefined. Ensure the environment variables are set."
	);
}

// Create the client once
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
	global: {
		fetch: (url: any, options = {}) => {
			return fetch(url, { ...options, cache: "no-store" });
		},
	},
});

export const supabaseClient = () => {
	return supabase;
};
