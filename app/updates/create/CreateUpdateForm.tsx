"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createAnnouncement } from "@/lib/updates";

const MarkdownPreview = dynamic(() => import("@/app/components/MarkdownPreview"), {
	loading: () => (
		<p className="text-muted-foreground italic">Loading preview...</p>
	),
	ssr: false,
});

export default function CreateUpdateForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		category: "feature" as "feature" | "fix" | "update" | "event",
		content: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const result = await createAnnouncement({
				...formData,
				status: "published",
			});

			if (result.success) {
				router.push("/updates");
			} else {
				alert(`Failed to create update: ${result.error}`);
			}
		} catch (error) {
			console.error(error);
			alert("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8 font-[family-name:var(--font-outfit)]">
			<h1 className="mb-6 text-3xl font-bold">Create New Update</h1>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						required
						maxLength={120}
						value={formData.title}
						onChange={(e) =>
							setFormData({ ...formData, title: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="category">Category</Label>
					<Select
						value={formData.category}
						onValueChange={(val: "feature" | "fix" | "update" | "event") =>
							setFormData({ ...formData, category: val })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="feature">Feature</SelectItem>
							<SelectItem value="fix">Fix</SelectItem>
							<SelectItem value="update">Update</SelectItem>
							<SelectItem value="event">Event</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="content">Content (Markdown)</Label>
					<Textarea
						id="content"
						required
						maxLength={10000}
						className="min-h-[200px] font-mono"
						value={formData.content}
						onChange={(e) =>
							setFormData({ ...formData, content: e.target.value })
						}
						placeholder="# Heading&#10;&#10;Explain the update here..."
					/>
				</div>

				<div className="space-y-2 rounded-md border bg-muted/50 p-4">
					<Label>Preview</Label>
					<div className="prose mt-2 max-w-none dark:prose-invert">
						{formData.content ? (
							<MarkdownPreview content={formData.content} />
						) : (
							<p className="text-muted-foreground italic">Nothing to preview</p>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? "Publishing..." : "Publish Update"}
					</Button>
				</div>
			</form>
		</div>
	);
}
