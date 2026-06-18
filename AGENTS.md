# AGENTS.md

Repo: Revo Member Tracker (Next.js 15 + Bun + MySQL/Drizzle + Better Auth).
Hosted at `revotracker.dvcklab.com`. See `README.md` for product/feature overview and `ADMIN_DASHBOARD.md` for the admin UI.

## Quick start

```bash
bun install
# .env must define DATABASE_URL and BETTER_AUTH_SECRET
bun run dev              # http://localhost:3000 (uses Turbopack)
bun run build && bun run start
bun run lint             # next lint (no separate typecheck script)
bunx drizzle-kit push    # sync app/db/schema.ts -> MySQL
bunx tsx scripts/seed-announcement.ts   # seeds one published announcement
```

Database: MySQL at `159.13.56.235:3300/Main` (per `.env`). Schema source of truth is `app/db/schema.ts` (note: `drizzle.config.ts` points at `app/db/schema.ts`, not `drizzle/schema.ts` — the `drizzle/` dir is just migration output).

There is **no test framework, no CI, and no `typecheck` script**. For a real typecheck use `bunx tsc --noEmit`. `bun run lint` runs `next lint` only.

## Repo layout (entrypoints that matter)

- `app/` — Next.js App Router.
  - `app/page.tsx` — landing redirect/list; `app/gyms/page.tsx` — gym list (server component, calls `lib/fetchData.ts:109 getGyms`).
  - `app/api/auth/[...all]/route.ts` — Better Auth handler (`toNextJsHandler(auth)` from `lib/auth.ts`).
  - `app/api/admin/proxy/route.ts` — admin-only reverse proxy; allowlists upstream via `ADMIN_API_URLS` / `NEXT_PUBLIC_ADMIN_API_URL` and forwards `ADMIN_API_TOKEN` as a Bearer header.
  - `app/api/db/gyminfo/route.ts` and `app/api/account/gym-preferences/route.ts` — direct Drizzle-backed reads.
  - `app/admin/*` — admin pages (diagnostics, logs, reports, gyms, users). `app/admin/layout.tsx:8` has a **dev-mode admin bypass** that always returns `true` for `isAdmin` when `NODE_ENV !== "production"` — keep that in mind when testing.
    - `app/admin/gyms/*` — gyms CRUD backed by the **local** `revoGyms` Drizzle table (NOT the admin proxy). `page.tsx` is a server component doing the list query from `searchParams` (q/sort/order/limit/offset); `GymsTable.tsx` is the client UI (search/sort/pagination via URL + create/edit/delete dialogs calling server actions); `actions.ts` (`createGym`/`updateGym`/`deleteGym`) is `"use server"`, Zod-validated, gated by `requireAdminSession()`. Delete is refused when `revoGymCount` rows still reference the gym — deactivate instead.
- `app/db/{database.ts,schema.ts,relations.ts}` — Drizzle MySQL connection and schema. Imported as `@/app/db/...`.
- `lib/auth.ts` — `betterAuth({...})` with email+password, `isAdmin` additional field, `nextCookies` plugin.
- `lib/authz.ts` — `getSessionOrThrow()`, `requireAdminSession()` for server actions/route handlers.
- `lib/security.ts` — in-process `Map`-backed rate limiter keyed by `${key}:${ip}`. Per-instance only — does not share state across containers/workers.
- `lib/updates.ts` — announcements CRUD (used by `/updates` and `/admin/users`).
- `lib/fetchData.ts` — gym DB reads + cached fetch from `https://revotrackerapi.dvcklab.com/gyms/trends` (`lib/fetchData.ts:428`).
- `components/ui/` — shadcn/ui primitives (new-york style, neutral base, `components.json`).
- `app/components/` — app-level shared (Header, Footer, theme provider, toaster, mobile nav).
- `data/*.json` — committed gym snapshots, written by `lib/filewriter.ts` (`saveToFile`). Not gitignored.
- `scripts/seed-announcement.ts` — one-off insert.

Path alias: `@/*` → repo root (`tsconfig.json`).

## Gotchas an agent will hit

- **Two schema files exist** (`app/db/schema.ts` and `drizzle/schema.ts`) with overlapping content. `drizzle-kit` and the app both import from `app/db/schema.ts`; the `drizzle/` directory is migration output. Don't edit `drizzle/schema.ts` by hand — edit `app/db/schema.ts` and run `bunx drizzle-kit generate` / `push`.
- **`auth-schema.ts` at repo root is dead code.** It re-declares `user`/`session`/`account`/`verification` and is not imported anywhere. Safe to delete.
- **Drizzle table names are PascalCase** (e.g. `revoGymCount` -> `Revo_Gym_Count`). Mind the snake_case column mappings.
- **CSP in `next.config.mjs` is strict.** `connect-src` is allowlisted to `http://localhost:3001`, `https://revotrackerapi.dvcklab.com`, and Google Analytics hosts. Adding a new external fetch will be blocked until you add the origin to the `cspDirectives` array.
- **Middleware** (`middleware.ts`) forces HTTPS for non-localhost in production only, via `x-forwarded-proto`.
- **`/api/gyms/stats/update` and `/api/gyms/stats/latest` are mentioned in `README.md` but are NOT real Next routes.** They are external API calls proxied at runtime through `/api/admin/proxy?path=/gyms/stats/update` etc. (`app/admin/diagnostics/page.tsx` uses `useApiCall` for this). Don't waste time grepping `app/api/gyms` — the directory doesn't exist.
- **Admin proxy allowlist**: comma-separated `ADMIN_API_URLS` env, fallback `NEXT_PUBLIC_ADMIN_API_URL`, default `http://localhost:3001`. Calls without a `baseUrl` query param use `allowed[0]`.
- **Sign-up accepts usernames**, not just emails: `app/auth/actions.ts:58` appends `@revo.local` when input lacks `@`. Password schema: 10+ chars, mixed case, digit (`app/auth/actions.ts:7`).
- **Rate-limit quotas** to be aware of if you change them: sign-up 5/15m, sign-in 10/15m, announcement create 10/15m.
- **Google Analytics ID `G-K1LEB4FNGE`** is hardcoded in `app/layout.tsx` via `next/script`.
- **Theme**: `next-themes` with `defaultTheme="system"`, `attribute="class"`. Dark mode tokens live in `app/globals.css` (HSL vars consumed by `tailwind.config.ts`).
- **Docker**: multi-stage `Dockerfile` (oven/bun:1-slim → node:22-slim) uses `output: "standalone"`. Build args needed: `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_ADMIN_API_URL`. `NEXT_TELEMETRY_DISABLED=1` is set in build + runtime. Exposes `:3000`, starts with `node server.js`.
- **The schema contains unused product-scraping tables** (`motherboards`, `items`, `itemSets`, `categories`, `subcategories`, `biosLinks`). They are declared in `app/db/schema.ts` but nothing in `app/` reads them — leftovers from another project. Don't be surprised by their presence in Drizzle types.
- **No `typecheck` script** — `tsconfig.json` uses strict + `noEmit` already. Use `bunx tsc --noEmit` if you want a typecheck before committing.

## Conventions

- Server actions live next to the route (`app/<area>/actions.ts`) and are marked `"use server"`.
- Zod validates every server-action input; reuse the schemas already defined next to the action.
- Drizzle queries: prefer the `db.select(...).from(table).innerJoin(...)` pattern in `lib/fetchData.ts:188` as the reference for column shape and ordering.
- shadcn/ui: add new primitives via the standard CLI; `components.json` already wires up aliases.
- Styling: utility-first Tailwind + HSL semantic tokens. Never use raw hex in components — pick a token like `bg-primary`/`text-muted-foreground`.
- Icons: `lucide-react` (see `app/components/Header.tsx` for usage).

## Don't touch without confirming

- `app/admin/layout.tsx` dev bypass (line 8) — removing/changing affects local admin UX.
- `next.config.mjs` CSP — adding/removing origins changes the security posture.
- `lib/security.ts` rate-limit `Map` — replacing with Redis/upstash changes deploy requirements.
- `Dockerfile` Bun/Node split — keep `bun install --frozen-lockfile` and the standalone output wiring in sync with `next.config.mjs` `output: "standalone"`.
