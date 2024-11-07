"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getErrorMessage } from "@/lib/utils";
import { signUpFormSchema } from "@/app/signup/SignUpForm";
import { z } from "zod";

export async function login(loginData: { email: string; password: string }) {
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword(loginData);

	if (error) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	redirect("/");
}

export async function signup(signUpData: z.infer<typeof signUpFormSchema>) {
	const supabase = await createClient();

	const { email, password, name } = signUpData;

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email,
		password,
		name,
	};

	const { error } = await supabase.auth.signUp(data);

	if (error) {
		return error.message;
	}

	revalidatePath("/", "layout");
	redirect("/");
}

export async function signOut() {
	try {
		const { auth } = await createClient();

		const { error } = await auth.signOut();

		if (error) throw error;

		return { errorMessage: null };
	} catch (error) {
		return { errorMessage: getErrorMessage(error) };
	}
}

export async function getGymPreferences(userId: string) {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("profiles")
			.select("gyms")
			.eq("id", userId)
			.single();

		if (error) {
			console.error("Error fetching user gym preferences:", error);
			throw error;
		}

		return data?.gyms || [];
	} catch (error) {
		return { errorMessage: getErrorMessage(error) };
	}
}

export async function updateGymPreferences(userId: string, gyms: string[]) {
	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("profiles")
			.upsert({ id: userId, gyms: gyms });

		if (error) {
			console.log(error);
			throw error;
		}

		return { errorMessage: null };
	} catch (error) {
		return { errorMessage: getErrorMessage(error) };
	}
}
