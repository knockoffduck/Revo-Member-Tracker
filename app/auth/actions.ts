"use server";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { z } from "zod";

const DUMMY_DOMAIN = "@revo.local";
const passwordSchema = z
	.string()
	.min(10, { message: "Password must be at least 10 characters long" })
	.regex(/[a-z]/, { message: "Password must include a lowercase letter" })
	.regex(/[A-Z]/, { message: "Password must include an uppercase letter" })
	.regex(/\d/, { message: "Password must include a number" });

const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { message: "Name must be at least 2 characters long" })
		.max(80, { message: "Name must be 80 characters or fewer" }),
	email: z
		.string()
		.trim()
		.min(3, { message: "Please enter a valid email or username" })
		.max(255, { message: "Email or username is too long" }),
	password: passwordSchema,
});

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(3, { message: "Please enter a valid email or username" })
		.max(255, { message: "Email or username is too long" }),
	password: z.string().min(1, { message: "Password is required" }),
});

export const signUpEmail = async (formData: FormData) => {
	await enforceRateLimit("auth:sign-up", {
		limit: 5,
		windowMs: 15 * 60 * 1000,
	});

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
	const { password } = validationResult.data;
	const name = validationResult.data.name.trim();
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
			isAdmin: false,
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
	await enforceRateLimit("auth:sign-in", {
		limit: 10,
		windowMs: 15 * 60 * 1000,
	});

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
