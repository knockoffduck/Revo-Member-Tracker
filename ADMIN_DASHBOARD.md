# Revo Tracker Admin Dashboard — Implementation Guide

A diagnostics / operations dashboard for the `Revo-Tracker-API` backend, built as protected admin pages inside the existing `Revo-Member-Tracker` Next.js app.

---

## 1. What it does

A single admin-only section (`/admin/*`) of the public site that lets you:

| Page | Purpose |
|---|---|
| `/admin/diagnostics` | One-click buttons for every backend API endpoint + buttons for every CLI maintenance script, each with a real-time progress bar, live log stream, elapsed timer, and final response viewer. |
| `/admin/logs` | Tabbed log browser. **Scrape log** = the rolling `logs/updated_stats.json` (last 5 scrape sessions, expandable to per-gym rows). **Server stream** = a live SSE tail of the API's stdout/stderr. |
| `/admin/reports` | Lists every `reports/stat-audit-*.json`, lets you filter by confidence/gym name, and shows a sortable table of repair proposals. |
| `/admin/gyms` | CRUD for the local `Revo_Gyms` table (search/sort/paginate, create/edit/delete, inline active toggle). Backed by server actions + Drizzle directly (not the admin proxy). |
| `/admin/users` | Search/edit/delete user accounts and toggle admin status (proxied to the external `Revo-Tracker-API`). |

The backend base URL is configurable in the UI (defaults to `http://localhost:3001`) and persisted in `localStorage`. You can also set a build-time default via `NEXT_PUBLIC_ADMIN_API_URL`. The dashboard talks to the backend directly via fetch + EventSource — no Next.js API route proxying required.

---

## 2. Files added / changed

### Frontend (Next.js — `Revo-Member-Tracker`)

```
app/admin/
  layout.tsx                  # Admin shell — auth gate + sidebar + BaseUrlProvider
  page.tsx                    # /admin → redirect to /admin/diagnostics
  diagnostics/page.tsx        # Main control panel
  logs/page.tsx               # Scrape log + live server log stream
  reports/page.tsx            # StatAudit report browser
  components/
    admin-sidebar.tsx         # Vertical nav (Diagnostics / Logs / Reports)
    base-url-context.tsx      # localStorage-backed base URL, buildUrl()
    base-url-selector.tsx     # Input + Save / Reset for the base URL
    use-api-call.ts           # Hook: fetch or EventSource-driven API call with progress + log events
    api-call-card.tsx         # Per-endpoint card: Run / Cancel / Reset, progress bar, log stream, JSON response
    script-runner-card.tsx    # Per-script card with options form + live stdout/stderr stream
    json-viewer.tsx           # Syntax-highlighted, copyable JSON viewer
components/ui/
  tabs.tsx                    # Minimal Radix-free Tabs primitive (new — was missing)
```

### Backend (Bun/Hono — `Revo-Tracker-API`)

```
src/
  index.ts                    # +CORS middleware, +admin route mount
  admin.ts                    # NEW — admin Hono app (all /admin/* routes)
  utils/
    progress.ts               # NEW — typed progress event bus + SSE helpers
    streaming.ts              # NEW — SSE-friendly wrappers around parseHTML / insertGymStats / updateGymInfo / runTrendAgent
    scriptRunner.ts           # NEW — spawns Bun subprocesses for Scraper scripts, parses stage tags, streams stdout
```

Small adjustments to existing files:
- `Revo-Tracker-API/src/index.ts` — added CORS middleware and `app.route("/", admin)`.
- `Revo-Member-Tracker/next.config.mjs` — added the default backend origin to the `connect-src` CSP directive so the dashboard can fetch/EventSource from `http://localhost:3001` (and the production API origin).
- `Revo-Member-Tracker/components/ui/progress.tsx` — fixed track/indicator styling so progress bars are visible.
- `Revo-Member-Tracker/app/admin/layout.tsx` — fixed negative margins that clipped the sidebar; added outer padding so the admin layout sits inset from the viewport edges.
- `Revo-Member-Tracker/app/admin/components/admin-sidebar.tsx` — rounded the sidebar container.
- `Revo-Member-Tracker/app/admin/components/base-url-context.tsx` — supports `NEXT_PUBLIC_ADMIN_API_URL` as the default backend URL (falls back to `http://localhost:3001`).

---

## 3. Authentication & authorization

The admin section has three layers:

1. **Frontend page gate** — `app/admin/layout.tsx` calls `isAdmin()` from `lib/updates.ts` (which wraps `requireAdminSession()` from `lib/authz.ts`). Non-admins are redirected to `/?admin=forbidden`. This re-uses the existing Better Auth `isAdmin` flag on the `user` table.

2. **Server-side API proxy** — every admin dashboard request to the backend is routed through `POST|GET /api/admin/proxy`. This route:
   - Validates the current user is a signed-in admin via Better Auth (`requireAdminSession()`).
   - Validates the requested backend base URL against an allowlist (`ADMIN_API_URLS`, falling back to `NEXT_PUBLIC_ADMIN_API_URL`, then `http://localhost:3001`).
   - Attaches the real backend `ADMIN_TOKEN` from the server environment (`ADMIN_API_TOKEN`) as `Authorization: Bearer <token>`.
   - Proxies the request and streams SSE responses back to the browser.

   The admin token never leaves the server, so you do not need to paste it into the dashboard UI.

3. **Backend gate** — every `/admin/*` route in `Revo-Tracker-API` still accepts a request if **either**:
   - The request is from loopback (default; toggle with `ADMIN_ALLOW_LOOPBACK=0`), or
   - An `ADMIN_TOKEN` env var is set and the request sends `Authorization: Bearer <token>` (or `?token=<token>`).

   Loopback is enabled by default so you can use the dashboard against `localhost:3001` without extra setup. Set `ADMIN_TOKEN` and disable loopback (`ADMIN_ALLOW_LOOPBACK=0`) for production.

> **Note:** Direct browser requests to `localhost:3001` don't send `X-Forwarded-For` / `X-Real-IP`, so the loopback check also accepts requests whose `Host` header is `localhost` (with optional port).

To make yourself an admin in the DB:
```sql
UPDATE user SET is_admin = 1 WHERE email = 'you@example.com';
```

---

## 4. Endpoints added to `Revo-Tracker-API`

All under `/admin/*`. All require auth (see §3). All responses use the same `{ success, data | error }` envelope as the rest of the API.

### Log / report access

| Method | Path | Returns |
|---|---|---|
| `GET` | `/admin/logs/scrape` | `logs/updated_stats.json` as a JSON array of session objects |
| `GET` | `/admin/logs/reports` | List of `reports/*.json` (filename, generatedAt, mode, summary, proposalCount) |
| `GET` | `/admin/logs/reports/:name` | Full report JSON. `name` is restricted to `[\w\-.]+\.json` |
| `GET` | `/admin/logs/stream` | **SSE** — live tail of `console.*` output from the API process |
| `GET` | `/admin/health` | `{ authenticatedAs: "loopback" \| "token" }` |

### Streaming API wrappers (SSE)

Each one runs the same logic as the existing endpoint but emits typed progress events as it goes.

| Method | Path | Wraps |
|---|---|---|
| `GET` | `/admin/gyms/update-stream` | `GET /gyms/update` |
| `GET` | `/admin/gyms/stats/update-stream` | `GET /gyms/stats/update` |
| `GET` | `/admin/gyms/stats/latest-stream` | `GET /gyms/stats/latest` (streams a quick DB query) |
| `POST` | `/admin/gyms/trends/generate-stream` | `GET /gyms/trends/generate?lookback=N` (body: `{ lookback }`) |

### Script runners (SSE)

`POST` body shape for all three: `{ options: { ... } }`. Output is streamed line-by-line and parsed for stage tags (`[FETCH]`, `[PARSE]`, `[DB]`, etc.) which surface as colored log events in the UI.

| Method | Path | Spawns |
|---|---|---|
| `POST` | `/admin/scripts/generate-cookies` | `bun run Scraper/generate_cookies.ts` |
| `POST` | `/admin/scripts/test-cookies` | `bun run Scraper/test_cookies.ts` |
| `POST` | `/admin/scripts/audit` | `bun run scripts/repair-gym-dropouts.ts` |

Audit options (forwarded as flags): `apply` (bool), `gym` (string), `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `minScore` (number, default 30), `confidence` (high|medium|all, default high), `verbose` (bool).

---

## 5. Event protocol

The SSE endpoint sends a stream of `data: <json>` frames separated by `\n\n`. Every payload is a `ProgressEvent`:

```ts
type ProgressEvent = {
  type: "progress" | "log" | "result" | "error" | "done";
  phase?: string;            // e.g. "fetching", "writing", "processing"
  current?: number;          // for progress: current step
  total?: number;            // for progress: total steps
  percent?: number;          // 0..100
  level?: "info" | "warn" | "error" | "success" | "debug" | "stderr" | "stdout";
  stage?: string;            // e.g. "FETCH", "PARSE", "DB", "TrendAgent"
  message?: string;          // human-readable line
  timestamp?: string;        // ISO 8601
  data?: unknown;            // final result (only on type:"result")
};
```

A typical successful run ends with: `…progress frames…  →  { type: "result", data: … }  →  { type: "done" }`.

Keep-alive comment frames (`: keep-alive\n\n`) are sent every 15s so reverse proxies don't close the connection.

---

## 6. Running it locally

### Backend

```bash
cd Revo-Tracker-API
cp .env.example .env  # fill in DATABASE_URL etc.
bun install
bun run dev           # starts on :3001
```

The admin module is auto-mounted. Test it:
```bash
curl http://localhost:3001/admin/health
# {"success":true,"data":{"authenticatedAs":"loopback","consoleHooked":false}}
```

To require a token (recommended for non-loopback use):
```bash
export ADMIN_TOKEN="$(openssl rand -hex 24)"
export ADMIN_ALLOW_LOOPBACK=0
bun run dev
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/admin/health
```

### Frontend

```bash
cd Revo-Member-Tracker
bun install
bun run dev           # starts on :3000
```

Visit `http://localhost:3000/admin/diagnostics`. You'll be redirected to sign in if you're not logged in, and bounced if you're not an admin. Once in:

1. Confirm the **Backend API URL** field shows `http://localhost:3001` (or change it to your dev server / production URL). The same selector appears on **Logs** and **Reports**.
2. Click any **Run** button to fire the corresponding request.
3. Open the **Logs** tab to tail the server's live output while you trigger runs.
4. Open the **Reports** tab to inspect any `reports/stat-audit-*.json` files.

For a deployed frontend, set `NEXT_PUBLIC_ADMIN_API_URL=https://your-api-domain.com` at build time so the default base URL points at the live backend instead of localhost.

---

## 7. Production deployment

### Frontend (Dokploy)

No special config is needed for the admin pages themselves, but the server-side proxy needs to know the backend token and allowed backend URLs:

```env
ADMIN_API_TOKEN=<same-value-as-backend-ADMIN_TOKEN>
ADMIN_API_URLS=https://revotrackerapi.dvcklab.com,http://localhost:3001
```

`ADMIN_API_URLS` is a comma-separated allowlist of backend base URLs the dashboard is allowed to proxy to. If it is not set, the proxy falls back to `NEXT_PUBLIC_ADMIN_API_URL` and then `http://localhost:3001`.

The browser no longer needs the admin token, so the token input has been removed from the dashboard UI.

### Backend

Add the env vars to your Dokploy service:

```env
ADMIN_TOKEN=<random-32-bytes>      # required in production
ADMIN_ALLOW_LOOPBACK=0             # disable loopback bypass
CORS_ORIGINS=https://revotracker.daffydvck.live,https://www.revotracker.daffydvck.live
```

`CORS_ORIGINS` is a comma-separated list of allowed origins. Add every frontend hostname that should be able to call the API.

If you also want to let local dev frontends on private IPs (e.g. `http://192.168.x.x:3000`) hit this deployed backend, set:

```env
CORS_ALLOW_PRIVATE_IPS=1
```

This echoes any `localhost`, `127.0.0.1`, `192.168.x.x`, `10.x.x.x`, or `172.16–172.31.x.x` origin in addition to the configured `CORS_ORIGINS`. Leave it unset in production if you don't need it.

The Dockerfile needs no changes — the new files are picked up automatically by the existing `bun run --hot src/index.ts` / `bun run src/index.ts` entry.

---

## 8. Design notes & gotchas

### Concurrent jobs

The progress bus is a single `EventEmitter` instance (stashed on `globalThis` to survive HMR). For now, **only one job should run at a time** to avoid interleaved events on a single subscriber. The UI already enforces this — each `ApiCallCard` / `ScriptRunnerCard` has a single subscriber, and the SSE stream is per-request, so jobs don't actually share an emitter. The bus is used in *push* mode: when the work function calls `progressBus.emit(...)`, only the subscriber for the *current* call receives it. This works because the admin endpoints run one stream per HTTP request.

If you ever need concurrent long-running jobs from the same client, swap the bus for a per-job key (e.g. `Map<jobId, Emitter>`).

### Capturing server logs

`src/admin.ts` patches `console.log`, `console.info`, `console.warn`, `console.error`, `console.debug` once on first request to `/admin/logs/stream`. Patches broadcast to a `Set<listener>`; the SSE response adds/removes itself on connect/disconnect. Stage tags (`[FETCH] …`, `[DB] …`) are parsed with a regex and surfaced as a colored `stage` badge in the log viewer.

ANSI color codes from the existing console logger are stripped via `/\x1b\[[0-9;]*m/g` so the dashboard gets clean text.

### Cookie 1/10 is not a required progress phase

The user asked for a real-time progress bar, but clarified that the existing `Cookie 1/10 … Cookie 2/10 …` text isn't a phase they want to model — those are individual log lines from the proxy cycle. The current implementation treats them as plain log entries (one per line). If you want a true `cookie 3/10` progress bar later, instrument `fetchPHPData` in `src/utils/parser.ts` to call `progressBus.emit({ type: "progress", phase: "cookie-cycle", current: i + 1, total: cookies.length })` inside the loop.

### Scrape streaming phases

For now the scrape endpoints only emit coarse phases — `fetching` (0→50%) and `writing` (60→100%) — because `parseHTML()` is a black box from the outside. To get finer-grained progress (e.g. per-cookie attempts, per-gym DB inserts) you would need to thread an `onProgress` callback through `parseHTML` → `fetchPHPData` and through `insertGymStats` / `updateGymInfo`. The bus is already there — only the call sites need updating.

### Trend generation phases

`runTrendAgent` logs `Processing N/M: GymName` lines via `console.log`. The dashboard's **Server stream** view picks those up automatically, so you can watch trend generation happen in real time even without changes to the trend agent itself.

### Stat audit

`bun run scripts/repair-gym-dropouts.ts` is spawned as a Bun subprocess. Its stdout is split on `\n`, classified as `info` / `warn` / `error` / `success` based on `✔` / `⚠` / `✖` / "error" keywords, and parsed for stage tags. After the script exits, the dashboard tries to read the most recent `reports/stat-audit-*.json` and surfaces it as the final result.

### CORS during local dev

When `CORS_ORIGINS` is **not** set, the API automatically echoes any `localhost`, `127.0.0.1`, `192.168.x.x`, `10.x.x.x`, or `172.16–172.31.x.x` origin so the dashboard works from any local network address. If you set `CORS_ORIGINS` explicitly, add your dev origin(s) to the list or set `CORS_ALLOW_PRIVATE_IPS=1` to keep the private-IP fallback.

### CSP `connect-src`

Next.js injects a strict `Content-Security-Policy` via `next.config.mjs`. The dashboard makes direct `fetch` and `EventSource` calls to the configurable backend URL, so that origin must be listed in `connect-src`. The default config now includes both `http://localhost:3001` and the production API origin (`https://revotrackerapi.dvcklab.com`). If you change the frontend domain or backend domain, update `connect-src` accordingly or the browser will block requests with a CSP violation.

---

## 9. File map (quick reference)

| File | Role |
|---|---|
| `Revo-Member-Tracker/app/admin/layout.tsx` | Auth gate + sidebar |
| `Revo-Member-Tracker/app/admin/diagnostics/page.tsx` | Main control panel |
| `Revo-Member-Tracker/app/admin/logs/page.tsx` | Scrape log + live stream |
| `Revo-Member-Tracker/app/admin/reports/page.tsx` | Report browser |
| `Revo-Member-Tracker/app/admin/components/api-call-card.tsx` | Per-endpoint UI |
| `Revo-Member-Tracker/app/admin/components/script-runner-card.tsx` | Per-script UI |
| `Revo-Member-Tracker/app/admin/components/use-api-call.ts` | fetch / EventSource hook (routes through `/api/admin/proxy`) |
| `Revo-Member-Tracker/app/admin/components/base-url-context.tsx` | localStorage base URL + `buildProxyUrl()` helper |
| `Revo-Member-Tracker/app/api/admin/proxy/route.ts` | Server-side admin API proxy (adds `ADMIN_TOKEN`, streams SSE) |
| `Revo-Member-Tracker/app/admin/components/json-viewer.tsx` | Colored JSON viewer |
| `Revo-Member-Tracker/components/ui/tabs.tsx` | Tabs primitive |
| `Revo-Member-Tracker/components/ui/progress.tsx` | Progress bar component (style fix) |
| `Revo-Member-Tracker/next.config.mjs` | CSP config including API `connect-src` |
| `Revo-Tracker-API/src/admin.ts` | All admin endpoints + auth + console hook |
| `Revo-Tracker-API/src/utils/progress.ts` | Event bus + SSE helpers |
| `Revo-Tracker-API/src/utils/streaming.ts` | Streaming wrappers around scrape/trend functions |
| `Revo-Tracker-API/src/utils/scriptRunner.ts` | Bun subprocess runner with stdout streaming |
| `Revo-Tracker-API/src/index.ts` | CORS + `app.route("/", admin)` |

---

## 10. Quick verification checklist

After deploying, verify:

- [x] `curl http://localhost:3001/admin/health` returns `{"success":true,...}`
- [x] `curl http://localhost:3001/admin/logs/scrape` returns the rolling log array
- [x] `/admin/gyms/stats/latest-stream` streams progress and completes successfully
- [x] `bun run lint` on the frontend passes with zero errors
- [ ] `bun run Scraper/generate_cookies.ts` is invokable from the dashboard with a confirmation dialog
- [ ] `POST /admin/gyms/trends/generate-stream` with `{"lookback": 7}` returns a stream of events
- [ ] `bunx tsc --noEmit` on the API shows no new errors (pre-existing errors in `proxy.ts` and `details.ts` are unrelated)
- [ ] Visiting `/admin` while signed out redirects to sign in
- [ ] Visiting `/admin` as a non-admin user redirects to `/?admin=forbidden`
- [ ] The **Server stream** view shows log events when the API emits `console.*` output
- [ ] Browser dev tools show no CSP violations for the configured backend origin
