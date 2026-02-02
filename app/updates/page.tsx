
import React from "react";
import UpdateCard from "@/app/components/UpdateCard";
import { getAnnouncements, isAdmin } from "@/lib/updates";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function UpdatesPage() {
    const updates = await getAnnouncements();
    const admin = await isAdmin();

    // Root layout already provides Header, Footer, and a wrapping main
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl font-[family-name:var(--font-outfit)]">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Updates</h1>
                    <p className="text-muted-foreground">
                        Stay tuned with the latest changes and announcements.
                    </p>
                </div>
                {admin && (
                    <Link href="/updates/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Update
                        </Button>
                    </Link>
                )}
            </div>

            <div className="space-y-6">
                {updates.length > 0 ? (
                    updates.map((update) => (
                        <UpdateCard
                            key={update.id}
                            title={update.title}
                            date={update.publishedAt || update.createdAt || ""}
                            category={update.category}
                            content={update.content}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        No updates found.
                    </div>
                )}
            </div>
        </div>
    );
}
