"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const DUMMY_DOMAIN = "@revo.local";

const updateEmailSchema = z.object({
    email: z.string().min(3, { message: "Please enter a valid email or username" }),
});

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const updateAccountEmail = async (formData: FormData) => {
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
            return { success: false, message: error.message || "Failed to update email/username" };
        }

        return { success: true, message: "Email/Username updated successfully" };
    } catch (error) {
        return { success: false, message: (error as Error)?.message || "Failed to update email/username" };
    }
};

export const updateAccountPassword = async (formData: FormData) => {
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
            return { success: false, message: error.message || "Failed to update password" };
        }

        return { success: true, message: "Password updated successfully" };
    } catch (error) {
        return { success: false, message: (error as Error)?.message || "Failed to update password. Check current password." };
    }
};


