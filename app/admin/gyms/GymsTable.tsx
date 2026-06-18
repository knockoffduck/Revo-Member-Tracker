"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	Loader2,
	ChevronLeft,
	ChevronRight,
	Plus,
	Dumbbell,
	X,
	AlertTriangle,
} from "lucide-react";
import { createGym, deleteGym, updateGym } from "./actions";

export type SortKey = "name" | "state" | "areaSize" | "postcode" | "squatRacks" | "active" | "lastUpdated";

export type GymAdminRow = {
	id: string;
	name: string;
	state: string;
	areaSize: number;
	lastUpdated: string;
	address: string;
	postcode: number;
	active: number;
	timezone: string;
	longitude: number | null;
	latitude: number | null;
	squatRacks: number;
};

type Pagination = { limit: number; offset: number; total: number };
type Search = { q: string; sort: SortKey; order: "asc" | "desc" };

type GymFormValues = {
	name: string;
	state: string;
	areaSize: string;
	address: string;
	postcode: string;
	squatRacks: string;
	timezone: string;
	latitude: string;
	longitude: string;
	active: boolean;
};

const EMPTY_FORM: GymFormValues = {
	name: "",
	state: "WA",
	areaSize: "",
	address: "",
	postcode: "",
	squatRacks: "0",
	timezone: "Australia/Perth",
	latitude: "",
	longitude: "",
	active: true,
};

function rowToForm(r: GymAdminRow): GymFormValues {
	return {
		name: r.name,
		state: r.state,
		areaSize: String(r.areaSize),
		address: r.address,
		postcode: String(r.postcode),
		squatRacks: String(r.squatRacks),
		timezone: r.timezone,
		latitude: r.latitude == null ? "" : String(r.latitude),
		longitude: r.longitude == null ? "" : String(r.longitude),
		active: !!r.active,
	};
}

function parseForm(v: GymFormValues) {
	return {
		name: v.name.trim(),
		state: v.state.trim(),
		areaSize: Number(v.areaSize),
		address: v.address.trim(),
		postcode: Number(v.postcode),
		squatRacks: Number(v.squatRacks),
		timezone: v.timezone.trim(),
		latitude: v.latitude.trim() === "" ? null : Number(v.latitude),
		longitude: v.longitude.trim() === "" ? null : Number(v.longitude),
		active: (v.active ? 1 : 0) as 0 | 1,
	};
}

function formatDate(iso: string) {
	const d = new Date(iso.replace(" ", "T"));
	if (isNaN(d.getTime())) return "-";
	return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const DEFAULT_ORDER: Record<SortKey, "asc" | "desc"> = {
	name: "asc",
	state: "asc",
	areaSize: "desc",
	postcode: "asc",
	squatRacks: "desc",
	active: "desc",
	lastUpdated: "desc",
};

export default function GymsTable({
	gyms,
	pagination,
	search,
}: {
	gyms: GymAdminRow[];
	pagination: Pagination;
	search: Search;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [rows, setRows] = useState<GymAdminRow[]>(gyms);
	useEffect(() => setRows(gyms), [gyms]);

	const [inputQ, setInputQ] = useState(search.q);
	useEffect(() => setInputQ(search.q), [search.q]);

	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const [createForm, setCreateForm] = useState<GymFormValues>(EMPTY_FORM);
	const [editing, setEditing] = useState<GymAdminRow | null>(null);
	const [editForm, setEditForm] = useState<GymFormValues>(EMPTY_FORM);
	const [deletingGym, setDeletingGym] = useState<GymAdminRow | null>(null);

	const createDialogRef = useRef<HTMLDialogElement>(null);
	const editDialogRef = useRef<HTMLDialogElement>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);

	const navigate = useCallback(
		(overrides: Record<string, string | number | undefined>, method: "push" | "replace" = "replace") => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, value] of Object.entries(overrides)) {
				if (value === undefined || value === null || value === "") params.delete(key);
				else params.set(key, String(value));
			}
			const qs = params.toString();
			const url = qs ? `${pathname}?${qs}` : pathname;
			if (method === "push") router.push(url, { scroll: false });
			else router.replace(url, { scroll: false });
		},
		[router, pathname, searchParams],
	);

	// Debounced search → update URL
	useEffect(() => {
		const timer = setTimeout(() => {
			if (inputQ !== search.q) {
				navigate({ q: inputQ || undefined, offset: 0 });
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [inputQ, search.q, navigate]);

	const onSortClick = (key: SortKey) => {
		const nextOrder: "asc" | "desc" =
			search.sort === key ? (search.order === "asc" ? "desc" : "asc") : DEFAULT_ORDER[key];
		navigate({ sort: key, order: nextOrder, offset: 0 });
	};

	const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
		<TableHead className={`cursor-pointer ${className ?? ""}`} onClick={() => onSortClick(k)}>
			{label} {search.sort === k && (search.order === "asc" ? "↑" : "↓")}
		</TableHead>
	);

	const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	const openCreate = () => {
		setCreateForm(EMPTY_FORM);
		createDialogRef.current?.showModal();
	};
	const closeCreate = () => {
		createDialogRef.current?.close();
		setCreateForm(EMPTY_FORM);
	};

	const openEdit = (r: GymAdminRow) => {
		setEditing(r);
		setEditForm(rowToForm(r));
		editDialogRef.current?.showModal();
	};
	const closeEdit = () => {
		editDialogRef.current?.close();
		setEditing(null);
	};

	const openDelete = (r: GymAdminRow) => {
		setDeletingGym(r);
		deleteDialogRef.current?.showModal();
	};
	const closeDelete = () => {
		deleteDialogRef.current?.close();
		setDeletingGym(null);
	};

	const submitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await createGym(parseForm(createForm));
			if (res.success) {
				toast.success(res.message);
				closeCreate();
				router.refresh();
			} else {
				toast.error(res.message || "Failed to create gym");
			}
		} catch (err) {
			toast.error((err as Error).message || "Failed to create gym");
		} finally {
			setSaving(false);
		}
	};

	const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editing) return;
		setSaving(true);
		try {
			const res = await updateGym(editing.id, parseForm(editForm));
			if (res.success) {
				toast.success(res.message);
				closeEdit();
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update gym");
			}
		} catch (err) {
			toast.error((err as Error).message || "Failed to update gym");
		} finally {
			setSaving(false);
		}
	};

	const confirmDelete = async () => {
		if (!deletingGym) return;
		setDeletingId(deletingGym.id);
		try {
			const res = await deleteGym(deletingGym.id);
			if (res.success) {
				setRows((prev) => prev.filter((r) => r.id !== deletingGym.id));
				toast.success(res.message);
				closeDelete();
				router.refresh();
			} else {
				toast.error(res.message || "Failed to delete gym");
			}
		} catch (err) {
			toast.error((err as Error).message || "Failed to delete gym");
		} finally {
			setDeletingId(null);
		}
	};

	const toggleActive = async (r: GymAdminRow) => {
		const next = (r.active ? 0 : 1) as 0 | 1;
		setRows((prev) => prev.map((g) => (g.id === r.id ? { ...g, active: next } : g)));
		try {
			const res = await updateGym(r.id, { active: next });
			if (res.success) {
				toast.success(next ? "Gym activated" : "Gym deactivated");
				router.refresh();
			} else {
				toast.error(res.message || "Update failed");
				setRows((prev) => prev.map((g) => (g.id === r.id ? { ...g, active: r.active } : g)));
			}
		} catch (err) {
			toast.error((err as Error).message || "Update failed");
			setRows((prev) => prev.map((g) => (g.id === r.id ? { ...g, active: r.active } : g)));
		}
	};

	const refresh = () => {
		setInputQ(search.q);
		router.refresh();
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<CardTitle>Gym locations</CardTitle>
							<CardDescription>
								{pagination.total} gym{pagination.total === 1 ? "" : "s"} ·{" "}
								{rows.filter((g) => g.active).length} active on this page
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search name, state or address"
									value={inputQ}
									onChange={(e) => setInputQ(e.target.value)}
									className="pl-9 w-[260px]"
								/>
							</div>
							<Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh">
								{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
							</Button>
							<Button size="sm" onClick={openCreate}>
								<Plus className="h-4 w-4 mr-1" />
								Add gym
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<SortHeader k="name" label="Name" />
								<SortHeader k="state" label="State" />
								<SortHeader k="postcode" label="Postcode" />
								<SortHeader k="areaSize" label="Area" />
								<SortHeader k="squatRacks" label="Racks" />
								<TableHead>Active</TableHead>
								<SortHeader k="lastUpdated" label="Updated" />
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.length === 0 && !saving && (
								<TableRow>
									<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
										No gyms found.
									</TableCell>
								</TableRow>
							)}
							{rows.map((g) => (
								<TableRow key={g.id}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<Dumbbell className="h-4 w-4 text-muted-foreground" />
											{g.name}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{g.state}</Badge>
									</TableCell>
									<TableCell className="font-mono text-muted-foreground">{g.postcode}</TableCell>
									<TableCell className="font-mono">{g.areaSize}</TableCell>
									<TableCell className="font-mono">{g.squatRacks}</TableCell>
									<TableCell>
										<Switch
											checked={!!g.active}
											onCheckedChange={() => toggleActive(g)}
											disabled={saving}
											aria-label="Toggle active"
										/>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{g.lastUpdated ? formatDate(g.lastUpdated) : "-"}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" aria-label="Actions">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEdit(g)}>
													<Pencil className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => openDelete(g)}
													className="text-destructive focus:text-destructive"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{saving &&
								Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`}>
										<TableCell colSpan={8}>
											<div className="h-4 w-32 bg-muted rounded animate-pulse" />
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
					{pagination.total > pagination.limit && (
						<div className="flex items-center justify-between px-6 py-4 border-t">
							<p className="text-xs text-muted-foreground">
								Page {currentPage} of {totalPages}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={pagination.offset === 0}
									onClick={() => navigate({ offset: Math.max(0, pagination.offset - pagination.limit) }, "push")}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={pagination.offset + pagination.limit >= pagination.total}
									onClick={() => navigate({ offset: pagination.offset + pagination.limit }, "push")}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create dialog */}
			<dialog
				ref={createDialogRef}
				className="backdrop:bg-black/50 p-0 rounded-xl shadow-lg w-full max-w-md open:animate-in open:fade-in-0 open:zoom-in-95"
				onClick={(e) => {
					if (e.target === createDialogRef.current) closeCreate();
				}}
			>
				<form onSubmit={submitCreate} className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Add gym</h2>
						<Button type="button" variant="ghost" size="icon" onClick={closeCreate}>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<GymFormFields values={createForm} onChange={(k, v) => setCreateForm((f) => ({ ...f, [k]: v }))} />
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={closeCreate} disabled={saving}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Create
						</Button>
					</div>
				</form>
			</dialog>

			{/* Edit dialog */}
			<dialog
				ref={editDialogRef}
				className="backdrop:bg-black/50 p-0 rounded-xl shadow-lg w-full max-w-md open:animate-in open:fade-in-0 open:zoom-in-95"
				onClick={(e) => {
					if (e.target === editDialogRef.current) closeEdit();
				}}
			>
				<form onSubmit={submitEdit} className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Edit gym</h2>
						<Button type="button" variant="ghost" size="icon" onClick={closeEdit}>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{editing && (
						<GymFormFields values={editForm} onChange={(k, v) => setEditForm((f) => ({ ...f, [k]: v }))} />
					)}
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={closeEdit} disabled={saving}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Save
						</Button>
					</div>
				</form>
			</dialog>

			{/* Delete confirmation dialog */}
			<dialog
				ref={deleteDialogRef}
				className="backdrop:bg-black/50 p-0 rounded-xl shadow-lg w-full max-w-sm open:animate-in open:fade-in-0 open:zoom-in-95"
				onClick={(e) => {
					if (e.target === deleteDialogRef.current) closeDelete();
				}}
			>
				<div className="p-6 space-y-4">
					<div className="flex items-start gap-3">
						<AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
						<div>
							<h2 className="text-lg font-semibold">Delete gym?</h2>
							<p className="text-sm text-muted-foreground">
								This permanently removes{" "}
								<span className="font-medium text-foreground">{deletingGym?.name}</span> from the
								registry. If historical count records exist, deletion will be blocked — deactivate instead.
							</p>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={closeDelete} disabled={!!deletingId}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={!!deletingId}>
							{deletingId === deletingGym?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Delete
						</Button>
					</div>
				</div>
			</dialog>
		</div>
	);
}

function GymFormFields({
	values,
	onChange,
}: {
	values: GymFormValues;
	onChange: <K extends keyof GymFormValues>(key: K, value: GymFormValues[K]) => void;
}) {
	return (
		<>
			<div className="space-y-2">
				<Label htmlFor="gym-name">Name</Label>
				<Input
					id="gym-name"
					value={values.name}
					onChange={(e) => onChange("name", e.target.value)}
					placeholder="e.g. Revo Athletic Malaga"
					required
				/>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="gym-state">State</Label>
					<Input
						id="gym-state"
						value={values.state}
						onChange={(e) => onChange("state", e.target.value)}
						placeholder="WA"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="gym-postcode">Postcode</Label>
					<Input
						id="gym-postcode"
						type="number"
						value={values.postcode}
						onChange={(e) => onChange("postcode", e.target.value)}
						placeholder="6090"
						required
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="gym-address">Address</Label>
				<Input
					id="gym-address"
					value={values.address}
					onChange={(e) => onChange("address", e.target.value)}
					placeholder="123 Example St, Suburb"
					required
				/>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="gym-area">Area size (m²)</Label>
					<Input
						id="gym-area"
						type="number"
						value={values.areaSize}
						onChange={(e) => onChange("areaSize", e.target.value)}
						placeholder="1800"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="gym-racks">Squat racks</Label>
					<Input
						id="gym-racks"
						type="number"
						value={values.squatRacks}
						onChange={(e) => onChange("squatRacks", e.target.value)}
						min={0}
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="gym-lat">Latitude</Label>
					<Input
						id="gym-lat"
						type="number"
						step="any"
						value={values.latitude}
						onChange={(e) => onChange("latitude", e.target.value)}
						placeholder="-31.84"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="gym-lng">Longitude</Label>
					<Input
						id="gym-lng"
						type="number"
						step="any"
						value={values.longitude}
						onChange={(e) => onChange("longitude", e.target.value)}
						placeholder="115.85"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="gym-tz">Timezone</Label>
				<Input
					id="gym-tz"
					value={values.timezone}
					onChange={(e) => onChange("timezone", e.target.value)}
					placeholder="Australia/Perth"
					required
				/>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					id="gym-active"
					checked={values.active}
					onCheckedChange={(v) => onChange("active", v)}
				/>
				<Label htmlFor="gym-active">Active (visible on public site)</Label>
			</div>
		</>
	);
}
