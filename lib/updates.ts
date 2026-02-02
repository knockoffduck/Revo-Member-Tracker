"use server";

import { db } from "@/app/db/database";
import { announcements } from "@/app/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getAnnouncements() {
    try {
        const updates = await db
            .select()
            .from(announcements)
            // Only fetch published announcements
            .where(eq(announcements.status, "published"))
            .orderBy(desc(announcements.publishedAt));

        return updates;
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
}

export async function getAllAnnouncements() {
    try {
        const updates = await db
            .select()
            .from(announcements)
            .orderBy(desc(announcements.createdAt));

        return updates;
    } catch (error) {
        console.error("Error fetching all announcements:", error);
        return [];
    }
}

export async function createAnnouncement(data: {
    title: string;
    content: string;
    category: "feature" | "fix" | "update" | "event";
    status: "draft" | "published";
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check if user is admin
    if (!(session.user as { isAdmin?: boolean }).isAdmin) {
        throw new Error("Forbidden: Admin access required");
    }

    try {
        const slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        await db.insert(announcements).values({
            title: data.title,
            slug: `${slug}-${Date.now()}`, // Ensure uniqueness
            content: data.content,
            category: data.category,
            status: data.status,
            publishedAt: data.status === "published" ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
            summary: data.content.slice(0, 150) + "...", // Auto-generate summary
        });

        revalidatePath("/updates");
        return { success: true };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { success: false, error: "Failed to create announcement" };
    }
}

export async function isAdmin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    console.log(session)
    return !!(session?.user as { isAdmin?: boolean })?.isAdmin;
}
