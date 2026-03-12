"use server";

import { db } from "@/app/db/database";
import { announcements } from "@/app/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/authz";
import { enforceRateLimit } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const announcementSchema = z.object({
	title: z.string().trim().min(3).max(120),
	content: z.string().trim().min(10).max(10000),
	category: z.enum(["feature", "fix", "update", "event"]),
	status: z.enum(["draft", "published"]),
});

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
    await enforceRateLimit("updates:create", {
        limit: 10,
        windowMs: 15 * 60 * 1000,
    });

    await requireAdminSession();

    const validationResult = announcementSchema.safeParse(data);
    if (!validationResult.success) {
        return { success: false, error: "Invalid announcement data" };
    }

    try {
        const { title, content, category, status } = validationResult.data;
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        await db.insert(announcements).values({
            title,
            slug: `${slug}-${Date.now()}`, // Ensure uniqueness
            content,
            category,
            status,
            publishedAt: status === "published" ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
            summary: `${content.slice(0, 150).trim()}...`,
        });

        revalidatePath("/updates");
        return { success: true };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { success: false, error: "Failed to create announcement" };
    }
}

export async function isAdmin() {
    try {
        const session = await requireAdminSession();
        return !!session.user;
    } catch {
        return false;
    }
}
