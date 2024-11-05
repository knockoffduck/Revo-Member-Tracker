"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getErrorMessage } from "@/lib/utils";

export async function login(data: { email: string; password: string }) {
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword(data);

	if (error) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	redirect("/");
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get("email") as string,
		password: formData.get("password") as string,
	};

	const { error } = await supabase.auth.signUp(data);

	if (error) {
		redirect("/error");
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
