"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useBaseUrl, buildUrl } from "../components/base-url-context";
import { BaseUrlSelector } from "../components/base-url-selector";
import { toast } from "sonner";
import {
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	Loader2,
	ChevronLeft,
	ChevronRight,
	ShieldCheck,
	User as UserIcon,
	X,
} from "lucide-react";

function formatDate(iso: string) {
	const d = new Date(iso);
	if (isNaN(d.getTime())) return "-";
	return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type AdminUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: number;
	image: string | null;
	isAdmin: number;
	createdAt: string;
	updatedAt: string;
	gymPreferences: unknown;
};

type Pagination = {
	limit: number;
	offset: number;
	total: number;
};

export default function UsersPage() {
	const { baseUrl, token } = useBaseUrl();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [pagination, setPagination] = useState<Pagination>({ limit: 25, offset: 0, total: 0 });
	const paginationRef = useRef(pagination);
	useEffect(() => {
		paginationRef.current = pagination;
	}, [pagination]);
	const [loading, setLoading] = useState(false);
	const [q, setQ] = useState("");
	const [sort, setSort] = useState("createdAt");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
	const [savingUser, setSavingUser] = useState(false);
	const [deletingUser, setDeletingUser] = useState<string | null>(null);
	const editDialogRef = useRef<HTMLDialogElement>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);

	const authHeaders = useMemo(() => {
		const headers: Record<string, string> = { "Content-Type": "application/json" };
		if (token) headers["Authorization"] = `Bearer ${token}`;
		return headers;
	}, [token]);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const url = buildUrl(baseUrl, "/admin/users", {
				q: q || undefined,
				limit: pagination.limit,
				offset: pagination.offset,
				sort,
				order,
			});
			const res = await fetch(url, { headers: authHeaders });
			const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { users: AdminUser[]; pagination: Pagination }; error?: string };
			if (!res.ok || !json.success) {
				toast.error(json.error || `Failed to load users (HTTP ${res.status})`);
				return;
			}
			setUsers(json.data?.users ?? []);
			setPagination(json.data?.pagination ?? paginationRef.current);
		} catch (err) {
			toast.error((err as Error).message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	}, [baseUrl, authHeaders, q, pagination.limit, pagination.offset, sort, order]);

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	const updateUser = async (id: string, body: Partial<Pick<AdminUser, "name" | "email" | "isAdmin">>) => {
		setSavingUser(true);
		try {
			const res = await fetch(buildUrl(baseUrl, `/admin/users/${id}`), {
				method: "PATCH",
				headers: authHeaders,
				body: JSON.stringify(body),
			});
			const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: AdminUser; error?: string };
			if (!res.ok || !json.success) {
				toast.error(json.error || `Update failed (HTTP ${res.status})`);
				return false;
			}
			setUsers((prev) => prev.map((u) => (u.id === id ? (json.data ?? u) : u)));
			toast.success("User updated");
			return true;
		} catch (err) {
			toast.error((err as Error).message || "Update failed");
			return false;
		} finally {
			setSavingUser(false);
		}
	};

	const deleteUser = async (id: string) => {
		setDeletingUser(id);
		try {
			const res = await fetch(buildUrl(baseUrl, `/admin/users/${id}`), {
				method: "DELETE",
				headers: authHeaders,
			});
			const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
			if (!res.ok || !json.success) {
				toast.error(json.error || `Delete failed (HTTP ${res.status})`);
				return;
			}
			setUsers((prev) => prev.filter((u) => u.id !== id));
			toast.success("User deleted");
		} catch (err) {
			toast.error((err as Error).message || "Delete failed");
		} finally {
			setDeletingUser(null);
		}
	};

	const toggleAdmin = async (u: AdminUser) => {
		const next = !u.isAdmin;
		const ok = await updateUser(u.id, { isAdmin: next ? 1 : 0 });
		if (!ok) {
			// revert local optimistic state handled by setUsers only on success
		}
	};

	const openEdit = (u: AdminUser) => {
		setEditingUser({ ...u });
		editDialogRef.current?.showModal();
	};

	const closeEdit = () => {
		editDialogRef.current?.close();
		setEditingUser(null);
	};

	const saveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingUser) return;
		const ok = await updateUser(editingUser.id, {
			name: editingUser.name,
			email: editingUser.email,
			isAdmin: editingUser.isAdmin,
		});
		if (ok) closeEdit();
	};

	const openDelete = (u: AdminUser) => {
		setEditingUser(u);
		deleteDialogRef.current?.showModal();
	};

	const closeDelete = () => {
		deleteDialogRef.current?.close();
		setEditingUser(null);
	};

	const confirmDelete = async () => {
		if (!editingUser) return;
		await deleteUser(editingUser.id);
		closeDelete();
	};

	const totalPages = Math.ceil(pagination.total / pagination.limit);
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Users</h1>
				<p className="text-sm text-muted-foreground">
					View, search, edit and manage accounts. Admin status can be toggled inline.
				</p>
			</div>

			<BaseUrlSelector />

			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<CardTitle>User accounts</CardTitle>
							<CardDescription>
								{pagination.total} total user{pagination.total === 1 ? "" : "s"}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search name or email"
									value={q}
									onChange={(e) => {
										setQ(e.target.value);
										setPagination((p) => ({ ...p, offset: 0 }));
									}}
									className="pl-9 w-[240px]"
								/>
							</div>
							<Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
								{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead
									className="cursor-pointer"
									onClick={() => {
										if (sort === "name") setOrder((o) => (o === "asc" ? "desc" : "asc"));
									else {
										setSort("name");
										setOrder("asc");
									}
								}}
								>
									Name {sort === "name" && (order === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead
									className="cursor-pointer"
									onClick={() => {
										if (sort === "email") setOrder((o) => (o === "asc" ? "desc" : "asc"));
									else {
										setSort("email");
										setOrder("asc");
									}
								}}
								>
									Email {sort === "email" && (order === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead>Admin</TableHead>
								<TableHead
									className="cursor-pointer"
									onClick={() => {
										if (sort === "createdAt") setOrder((o) => (o === "asc" ? "desc" : "asc"));
									else {
										setSort("createdAt");
										setOrder("desc");
									}
								}}
								>
									Joined {sort === "createdAt" && (order === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.length === 0 && !loading && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
										No users found.
									</TableCell>
								</TableRow>
							)}
							{users.map((u) => (
								<TableRow key={u.id}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											{u.isAdmin ? (
												<ShieldCheck className="h-4 w-4 text-primary" />
											) : (
												<UserIcon className="h-4 w-4 text-muted-foreground" />
											)}
											{u.name}
										</div>
									</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>
										<Switch
											checked={!!u.isAdmin}
											onCheckedChange={() => toggleAdmin(u)}
											disabled={savingUser}
											aria-label="Toggle admin"
										/>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{u.createdAt ? formatDate(u.createdAt) : "-"}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" aria-label="Actions">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEdit(u)}>
													<Pencil className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => openDelete(u)}
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
							{loading &&
								Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`}>
										<TableCell colSpan={5}>
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
									onClick={() => setPagination((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={pagination.offset + pagination.limit >= pagination.total}
									onClick={() => setPagination((p) => ({ ...p, offset: p.offset + p.limit }))}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Edit dialog */}
			<dialog
				ref={editDialogRef}
				className="backdrop:bg-black/50 p-0 rounded-xl shadow-lg w-full max-w-md open:animate-in open:fade-in-0 open:zoom-in-95"
				onClick={(e) => {
					if (e.target === editDialogRef.current) closeEdit();
				}}
			>
				<form onSubmit={saveEdit} className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Edit user</h2>
						<Button type="button" variant="ghost" size="icon" onClick={closeEdit}>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{editingUser && (
						<>
							<div className="space-y-2">
								<Label htmlFor="edit-name">Name</Label>
								<Input
									id="edit-name"
									value={editingUser.name}
									onChange={(e) => setEditingUser({ ...(editingUser as AdminUser), name: e.target.value })}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-email">Email</Label>
								<Input
									id="edit-email"
									type="email"
									value={editingUser.email}
									onChange={(e) => setEditingUser({ ...(editingUser as AdminUser), email: e.target.value })}
									required
								/>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									id="edit-admin"
									checked={!!editingUser.isAdmin}
									onCheckedChange={(v) => setEditingUser({ ...(editingUser as AdminUser), isAdmin: v ? 1 : 0 })}
								/>
								<Label htmlFor="edit-admin">Admin access</Label>
							</div>
						</>
					)}
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={closeEdit} disabled={savingUser}>
							Cancel
						</Button>
						<Button type="submit" disabled={savingUser}>
							{savingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
					<div>
						<h2 className="text-lg font-semibold">Delete user?</h2>
						<p className="text-sm text-muted-foreground">
							This cannot be undone. {editingUser && <span className="font-medium text-foreground">{editingUser.name}</span>} will be permanently removed.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={closeDelete} disabled={!!deletingUser}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={!!deletingUser}>
							{deletingUser === editingUser?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Delete
						</Button>
					</div>
				</div>
			</dialog>
		</div>
	);
}
