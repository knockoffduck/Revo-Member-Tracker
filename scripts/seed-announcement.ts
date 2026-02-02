import { db } from "@/app/db/database";
import { announcements } from "@/app/db/schema";

async function seed() {
    console.log("Seeding announcement...");
    try {
        await db.insert(announcements).values({
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
            publishedAt: new Date().toISOString(),
        });
        console.log("Announcement seeded successfully!");
    } catch (error) {
        console.error("Error seeding announcement:", error);
    }
    process.exit(0);
}

seed();
