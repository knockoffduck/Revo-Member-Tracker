"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaseUrl } from "./base-url-context";
import { RotateCcw, Save, Server } from "lucide-react";

export function BaseUrlSelector() {
	const { baseUrl, setBaseUrl, resetBaseUrl } = useBaseUrl();
	const [draft, setDraft] = useState(baseUrl);
	const [saved, setSaved] = useState(false);

	const onSave = () => {
		setBaseUrl(draft);
		setSaved(true);
		setTimeout(() => setSaved(false), 1500);
	};

	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Server className="h-4 w-4" />
				Backend API URL
			</div>
			<div className="space-y-2">
				<Label htmlFor="base-url" className="text-xs text-muted-foreground">
					Defaults to localhost:3001. Persists in localStorage.
				</Label>
				<div className="flex gap-2">
					<Input
						id="base-url"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						placeholder="http://localhost:3001"
						className="font-mono text-sm"
					/>
					<Button onClick={onSave} size="sm" variant={saved ? "secondary" : "default"}>
						<Save className="h-3.5 w-3.5 mr-1" />
						{saved ? "Saved" : "Save"}
					</Button>
					<Button onClick={resetBaseUrl} size="sm" variant="ghost" title="Reset to default">
						<RotateCcw className="h-3.5 w-3.5" />
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					Current: <span className="font-mono text-foreground">{baseUrl}</span>
				</p>
			</div>
		</div>
	);
}
