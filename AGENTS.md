# AGENTS.md

Repo: Revo Member Tracker (Next.js 15 + Bun; PocketBase for gym/announcement data, Better Auth + MySQL via drizzle for user accounts).
Hosted at `revotracker.dvcklab.com`. See `README.md` for product/feature overview and `ADMIN_DASHBOARD.md` for the admin UI.

## Quick start

```bash
bun install
# .env must define POCKETBASE_URL, NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD,
# DATABASE_URL (MySQL), BETTER_AUTH_SECRET, BETTER_AUTH_URL — see .env.example
bun run dev              # http://localhost:3000 (uses Turbopack)
bun run build && bun run start
bun run lint             # next lint (no separate typecheck script)
bunx tsx scripts/seed-announcement.ts   # seeds one published announcement
```

Database: PocketBase at `https://pb.dvcklab.work` (per `.env`). There is **no test framework, no CI, and no `typecheck` script**. For a real typecheck use `bunx tsc --noEmit`. `bun run lint` runs `next lint` only.

## Repo layout (entrypoints that matter)

- `app/` — Next.js App Router.
  - `app/page.tsx` — landing redirect/list; `app/gyms/page.tsx` — gym list (server component, calls `lib/fetchData.ts:109 getGyms`).
  - `app/api/admin/proxy/route.ts` — admin-only reverse proxy; allowlists upstream via `ADMIN_API_URLS` / `NEXT_PUBLIC_ADMIN_API_URL` and forwards `ADMIN_API_TOKEN` as a Bearer header.
  - `app/api/db/gyminfo/route.ts` and `app/api/account/gym-preferences/route.ts` — direct PocketBase-backed reads.
  - `app/admin/*` — admin pages (diagnostics, logs, reports, gyms, users). `app/admin/layout.tsx:8` has a **dev-mode admin bypass** that always returns `true` for `isAdmin` when `NODE_ENV !== "production"` — keep that in mind when testing.
    - `app/admin/gyms/*` — gyms CRUD backed by the **PocketBase** `Revo_Gyms` collection. `page.tsx` is a server component doing the list query from `searchParams` (q/sort/order/limit/offset); `GymsTable.tsx` is the client UI (search/sort/pagination via URL + create/edit/delete dialogs calling server actions); `actions.ts` (`createGym`/`updateGym`/`deleteGym`) is `"use server"`, Zod-validated, gated by `requireAdminSession()`.
- `app/db/database.ts` — drizzle/mysql2 pool (server-side, auth DB only).
- `app/db/schema.ts` — drizzle schema for the Better Auth MySQL tables (user/session/account/verification).
- `app/api/auth/[...all]/route.ts` — Better Auth handler.
- `lib/auth.ts` — `betterAuth` instance (drizzle adapter, MySQL, `nextCookies` plugin).
- `lib/auth-client.ts` — Better Auth react client (`createAuthClient`).
- `lib/current-user.ts` — server-side `getSession()`/`getCurrentUser()` helpers (Better Auth + `headers()`).
- `lib/authz.ts` — `getSessionOrThrow()`, `requireAdminSession()` for server actions/route handlers.
- `lib/server/pocketbase.ts` — server-side PocketBase helpers: admin auth (cached token), public client factory.
- `lib/security.ts` — in-process `Map`-backed rate limiter keyed by `${key}:${ip}`. Per-instance only — does not share state across containers/workers.
- `lib/updates.ts` — announcements CRUD (used by `/updates` and `/admin/users`).
- `lib/fetchData.ts` — gym DB reads via PocketBase + cached fetch from `https://revotrackerapi.dvcklab.com/gyms/trends`.
- `components/ui/` — shadcn/ui primitives (new-york style, neutral base, `components.json`).
- `app/components/` — app-level shared (Header, Footer, theme provider, toaster, mobile nav).
- `data/*.json` — committed gym snapshots, written by `lib/filewriter.ts` (`saveToFile`). Not gitignored.
- `scripts/seed-announcement.ts` — one-off insert into PocketBase.
- `scripts/migrate-users-to-pocketbase.ts` — migrate legacy `user` collection records into PocketBase's built-in `users` auth collection.

Path alias: `@/*` → repo root (`tsconfig.json`).

## Gotchas an agent will hit

- **Hybrid data architecture.** Gym/announcement data lives in PocketBase (`lib/server/pocketbase.ts`, admin token cached in-process). User accounts live in MySQL via Better Auth + drizzle (`app/db/schema.ts`). There is no `drizzle/` migrations dir and no top-level `auth-schema.ts` — the MySQL schema is managed externally.
- **Auth is Better Auth** (email/password), served at `/api/auth/[...all]`. Session user has `isAdmin` + `gymPreferences` additional fields (see `lib/current-user.ts`).
- **CSP in `next.config.mjs` is strict.** `connect-src` is allowlisted to `https://pb.dvcklab.work`, `http://localhost:3001`, `https://revotrackerapi.dvcklab.com`, and Google Analytics hosts. Adding a new external fetch will be blocked until you add the origin to the `cspDirectives` array.
- **Middleware** (`middleware.ts`) forces HTTPS for non-localhost in production only, via `x-forwarded-proto`.
- **`/api/gyms/stats/update` and `/api/gyms/stats/latest` are mentioned in `README.md` but are NOT real Next routes.** They are external API calls proxied at runtime through `/api/admin/proxy?path=/gyms/stats/update` etc. (`app/admin/diagnostics/page.tsx` uses `useApiCall` for this). Don't waste time grepping `app/api/gyms` — the directory doesn't exist.
- **Admin proxy allowlist**: comma-separated `ADMIN_API_URLS` env, fallback `NEXT_PUBLIC_ADMIN_API_URL`, default `http://localhost:3001`. Calls without a `baseUrl` query param use `allowed[0]`.
- **Sign-up accepts usernames**, not just emails: `app/auth/actions.ts` appends `@revo.local` when input lacks `@`. Password schema: 10+ chars, mixed case, digit (`app/auth/actions.ts`).
- **Rate-limit quotas** to be aware of if you change them: sign-up 5/15m, sign-in 10/15m, announcement create 10/15m, account actions 5/15m.
- **Google Analytics ID `G-K1LEB4FNGE`** is hardcoded in `app/layout.tsx` via `next/script`.
- **Theme**: `next-themes` with `defaultTheme="system"`, `attribute="class"`. Dark mode tokens live in `app/globals.css` (HSL vars consumed by `tailwind.config.ts`).
- **Docker**: multi-stage `Dockerfile` (oven/bun:1-alpine deps+builder → node:22-alpine runner) uses `output: "standalone"` and BuildKit cache mounts (`/root/.bun/install/cache`, `/app/.next/cache`) — warm rebuilds ≈ 1–2 min. Build args: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_ADMIN_API_URL`, `NEXT_PUBLIC_POCKETBASE_URL` (inlined into client bundle, must be real at build); `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` have placeholder defaults for the build stage only — inject real values at **runtime**. Runs as non-root `node` user, exposes `:3000`, starts with `node server.js`. `.dockerignore` excludes `data/`, `scripts/`, screenshots, and `trends_output.json` (nothing reads them at runtime).
- **No `typecheck` script** — `tsconfig.json` uses strict + `noEmit` already. Use `bunx tsc --noEmit` if you want a typecheck before committing.
- **Cloudflare Pages**: the project is not yet configured for `@cloudflare/next-on-pages`. To deploy on Cloudflare Pages, install the package and configure `wrangler.toml` / `package.json` scripts accordingly.

## Conventions

- Server actions live next to the route (`app/<area>/actions.ts`) and are marked `"use server"`.
- Zod validates every server-action input; reuse the schemas already defined next to the action.
- Drizzle is used only for the auth MySQL DB (see `lib/current-user.ts` for the query pattern); all gym/announcement reads go through the PocketBase SDK.
- shadcn/ui: add new primitives via the standard CLI; `components.json` already wires up aliases.
- Styling: utility-first Tailwind + HSL semantic tokens. Never use raw hex in components — pick a token like `bg-primary`/`text-muted-foreground`.
- Icons: `lucide-react` (see `app/components/Header.tsx` for usage).

## Don't touch without confirming

- `app/admin/layout.tsx` dev bypass (line 8) — removing/changing affects local admin UX.
- `next.config.mjs` CSP — adding/removing origins changes the security posture.
- `lib/security.ts` rate-limit `Map` — replacing with Redis/upstash changes deploy requirements.
- `Dockerfile` Bun/Node split — keep `bun install --frozen-lockfile` and the standalone output wiring in sync with `next.config.mjs` `output: "standalone"`.
