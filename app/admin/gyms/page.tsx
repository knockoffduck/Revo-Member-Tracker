import { createAdminPb } from "@/lib/server/pocketbase";
import GymsTable, { GymAdminRow, SortKey } from "./GymsTable";

export const dynamic = "force-dynamic";

const SORT_KEYS: SortKey[] = ["name", "state", "areaSize", "postcode", "squatRacks", "active", "lastUpdated"];

export default async function GymsAdminPage(props: {
	searchParams?: Promise<{
		q?: string;
		sort?: string;
		order?: string;
		limit?: string;
		offset?: string;
	}>;
}) {
	const sp = await props.searchParams;
	const q = (sp?.q ?? "").trim();
	const sortRaw = (sp?.sort ?? "name") as SortKey;
	const sort: SortKey = SORT_KEYS.includes(sortRaw) ? sortRaw : "name";
	const order = sp?.order === "desc" ? "desc" : "asc";
	const limit = Math.min(Math.max(Number(sp?.limit ?? 25) || 25, 1), 100);
	const page = Math.floor(Math.max(Number(sp?.offset ?? 0) || 0, 0) / limit) + 1;

	const sortFieldMap: Record<SortKey, string> = {
		name: "name",
		state: "state",
		areaSize: "area_size",
		postcode: "postcode",
		squatRacks: "Squat_Racks",
		active: "active",
		lastUpdated: "last_updated",
	};

	let filter = "";
	if (q) {
		const escaped = q.replace(/'/g, "\\'");
		filter = `(name~'${escaped}' || state~'${escaped}' || address~'${escaped}')`;
	}

	let total = 0;
	let gyms: GymAdminRow[] = [];
	let loadError: string | null = null;

	try {
		const pb = await createAdminPb();
		const result = await pb.collection("Revo_Gyms").getList(page, limit, {
			filter: filter || undefined,
			sort: `${order === "desc" ? "-" : "+"}${sortFieldMap[sort]}`,
		});

		total = result.totalItems;
		gyms = result.items.map((r) => ({
			id: r.id,
			name: r.name,
			state: r.state,
			areaSize: r.area_size,
			address: r.address,
			postcode: r.postcode,
			active: r.active ? 1 : 0,
			timezone: r.timezone,
			longitude: r.longitude,
			latitude: r.latitude,
			squatRacks: r.Squat_Racks,
			lastUpdated: r.last_updated,
		}));
	} catch (err) {
		loadError = (err as Error)?.message || "Failed to load gyms";
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Gyms</h1>
				<p className="text-sm text-muted-foreground">
					Manage the list of Revo gyms shown across the site. Deactivate a gym to hide it from public views without losing its history.
				</p>
			</div>
			{loadError ? (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
					<p className="font-medium">Failed to load gyms</p>
					<p className="mt-1 text-destructive/80">{loadError}</p>
				</div>
			) : (
				<GymsTable
					gyms={gyms}
					pagination={{ limit, offset: (page - 1) * limit, total }}
					search={{ q, sort, order }}
				/>
			)}
		</div>
	);
}
