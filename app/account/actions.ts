"use server";

import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { headers } from "next/headers";
import { z } from "zod";

const DUMMY_DOMAIN = "@revo.local";
const passwordSchema = z
	.string()
	.min(10, { message: "Password must be at least 10 characters long" })
	.regex(/[a-z]/, { message: "Password must include a lowercase letter" })
	.regex(/[A-Z]/, { message: "Password must include an uppercase letter" })
	.regex(/\d/, { message: "Password must include a number" });

const updateEmailSchema = z.object({
	email: z
		.string()
		.trim()
		.min(3, { message: "Please enter a valid email or username" })
		.max(255, { message: "Email or username is too long" }),
});

const updatePasswordSchema = z.object({
	currentPassword: z
		.string()
		.min(1, { message: "Current password is required" }),
	newPassword: passwordSchema,
});

export const updateAccountEmail = async (formData: FormData) => {
	await enforceRateLimit("account:change-email", {
		limit: 5,
		windowMs: 15 * 60 * 1000,
	});

	const rawData = Object.fromEntries(formData);
	const validationResult = updateEmailSchema.safeParse(rawData);

	if (!validationResult.success) {
		return {
			success: false,
			message: "Invalid input",
			error: validationResult.error.format(),
		};
	}

	let { email } = validationResult.data;

    // Apply username logic
	if (!email.includes("@")) {
		email = `${email}${DUMMY_DOMAIN}`;
	}

	try {
		const response = await auth.api.changeEmail({
			body: {
				newEmail: email,
			},
			headers: await headers(),
			asResponse: true,
		});

		if (!response.ok) {
			const error = await response.json();
			return {
				success: false,
				message: error.message || "Failed to update email/username",
			};
		}

		return {
			success: true,
			message: "Email/Username updated successfully",
		};
	} catch (error) {
		return {
			success: false,
			message:
				(error as Error)?.message || "Failed to update email/username",
		};
	}
};

export const updateAccountPassword = async (formData: FormData) => {
	await enforceRateLimit("account:change-password", {
		limit: 5,
		windowMs: 15 * 60 * 1000,
	});

	const rawData = Object.fromEntries(formData);
	const validationResult = updatePasswordSchema.safeParse(rawData);

	if (!validationResult.success) {
		return {
			success: false,
			message: "Invalid input",
			error: validationResult.error.format(),
		};
	}

	const { currentPassword, newPassword } = validationResult.data;

	try {
		const response = await auth.api.changePassword({
			body: {
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			},
			headers: await headers(),
			asResponse: true,
		});

		if (!response.ok) {
			const error = await response.json();
			return {
				success: false,
				message: error.message || "Failed to update password",
			};
		}

		return { success: true, message: "Password updated successfully" };
	} catch (error) {
		return {
			success: false,
			message:
				(error as Error)?.message ||
				"Failed to update password. Check current password.",
		};
	}
};
