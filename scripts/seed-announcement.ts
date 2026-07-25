import { createAdminPb } from "@/lib/server/pocketbase";

async function seed() {
    console.log("Seeding announcement...");
    try {
        const pb = await createAdminPb();
        await pb.collection("announcements").create({
            title: "Welcome to the new Updates Tab!",
            slug: "welcome-updates",
            content: `
# Welcome!

We are excited to introduce the **Updates** tab. Here you will find:

- Feature announcements
- Bug fixes
- Maintenance schedules
- And more!

Stay tuned for more updates.
      `,
            summary: "Introduction to the new updates feature.",
            category: "feature",
            status: "published",
            published_at: new Date().toISOString(),
        });
        console.log("Announcement seeded successfully!");
    } catch (error) {
        console.error("Error seeding announcement:", error);
    }
    process.exit(0);
}

seed();
