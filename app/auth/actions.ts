"use server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const DUMMY_DOMAIN = "@revo.local";

const signUpSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Name must be at least 2 characters long" }),
	email: z.string().min(3, { message: "Please enter a valid email or username" }),
	password: z.string().min(6),
});

const signInSchema = z.object({
	email: z.string().min(3, { message: "Please enter a valid email or username" }),
	password: z.string().min(6),
});

export const signUpEmail = async (formData: FormData) => {
	const rawData = Object.fromEntries(formData);
	const validationResult = signUpSchema.safeParse(rawData);
	if (!validationResult.success) {
		return {
			success: false,
			message: "Invalid form data. Please check your entries.",
			error: validationResult.error.format(),
		};
	}
	// If validation succeeds, proceed with authentication logic
	const { name, password } = validationResult.data;
	let { email } = validationResult.data;

	// If email doesn't look like an email, append dummy domain
	if (!email.includes("@")) {
		email = `${email}${DUMMY_DOMAIN}`;
	}

	const response = await auth.api.signUpEmail({
		body: {
			name,
			email,
			password,
		},
		asResponse: true,
	});

	if (!response.ok) {
		const errorData = await response.json();
		return {
			success: false,
			message: errorData.message || "Something went wrong",
		};
	}

	return {
		success: true,
		message: "Account created successfully",
	};
};

export const signInEmail = async (formData: FormData) => {
	const rawData = Object.fromEntries(formData);
	const validationResult = signInSchema.safeParse(rawData);
	if (!validationResult.success) {
		return {
			success: false,
			message: "Invalid form data. Please check your entries.",
			error: validationResult.error.format(),
		};
	}
	// If validation succeeds, proceed with authentication logic
	const { password } = validationResult.data;
	let { email } = validationResult.data;

	// If email doesn't look like an email, append dummy domain
	if (!email.includes("@")) {
		email = `${email}${DUMMY_DOMAIN}`;
	}

	const response = await auth.api.signInEmail({
		body: {
			email,
			password,
		},
		asResponse: true,
	});

	if (!response.ok) {
		const errorData = await response.json();
		// In case errorData.message is undefined or not user-friendly
		return {
			success: false,
			message: errorData.message || "Invalid credentials or server error",
		};
	}

	return {
		success: true,
		message: "Signed in successfully",
	};
};
