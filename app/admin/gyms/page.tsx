import { db } from "@/app/db/database";
import { revoGyms } from "@/app/db/schema";
import { asc, count, desc, like, or } from "drizzle-orm";
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
	const offset = Math.max(Number(sp?.offset ?? 0) || 0, 0);

	const condition = q
		? or(
				like(revoGyms.name, `%${q}%`),
				like(revoGyms.state, `%${q}%`),
				like(revoGyms.address, `%${q}%`),
			)
		: undefined;

	const sortColumn = {
		name: revoGyms.name,
		state: revoGyms.state,
		areaSize: revoGyms.areaSize,
		postcode: revoGyms.postcode,
		squatRacks: revoGyms.squatRacks,
		active: revoGyms.active,
		lastUpdated: revoGyms.lastUpdated,
	}[sort];
	const orderBy = order === "desc" ? desc(sortColumn) : asc(sortColumn);

	const [rows, totalRows] = await Promise.all([
		db.select().from(revoGyms).where(condition).orderBy(orderBy).limit(limit).offset(offset),
		db.select({ c: count() }).from(revoGyms).where(condition),
	]);

	const total = Number(totalRows[0]?.c ?? 0);
	const gyms: GymAdminRow[] = rows.map((r) => ({ ...r }));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Gyms</h1>
				<p className="text-sm text-muted-foreground">
					Manage the list of Revo gyms shown across the site. Deactivate a gym to hide it from public views without losing its history.
				</p>
			</div>
			<GymsTable
				gyms={gyms}
				pagination={{ limit, offset, total }}
				search={{ q, sort, order }}
			/>
		</div>
	);
}
