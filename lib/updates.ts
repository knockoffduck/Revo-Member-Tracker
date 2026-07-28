"use server";

import { createAdminPb, createPublicPb } from "@/lib/server/pocketbase";
import { requireAdminSession } from "@/lib/authz";
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
		const pb = createPublicPb();
		const updates = await pb.collection("announcements").getFullList({
			filter: "status='published'",
			sort: "-published_at",
			batch: 100,
		});

		return updates;
	} catch (error) {
		console.error("Error fetching announcements:", error);
		return [];
	}
}

export async function getAllAnnouncements() {
	try {
		const pb = createPublicPb();
		const updates = await pb.collection("announcements").getFullList({
			sort: "-created_at",
			batch: 100,
		});

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

		const pb = await createAdminPb();
		await pb.collection("announcements").create({
			title,
			slug: `${slug}-${Date.now()}`,
			content,
			category,
			status,
			published_at: status === "published" ? new Date().toISOString() : null,
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
		await requireAdminSession();
		return true;
	} catch {
		return false;
	}
}
