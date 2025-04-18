"use server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const signUpSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Name must be at least 2 characters long" }),
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z.string().min(6),
});

const signInSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
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
	const { name, email, password } = validationResult.data;
	const response = await auth.api.signUpEmail({
		body: {
			name,
			email,
			password,
		},
		asResponse: true,
	});
	redirect("/");
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
	const { email, password } = validationResult.data;
	const response = await auth.api.signInEmail({
		body: {
			email,
			password,
		},
		asResponse: true,
	});
	redirect("/");
};
